import pluginInfo from "../../plugin-manifest.json";
import i18n from "../../i18n";
import {
    TEST_RESULT,
    fieldErrorFor,
    testConfiguration,
} from "../../common/ai-worker";
import {
    addEntry,
    markConnected,
    restoreBanner,
    setBanner,
    withState,
} from "../../common/logs-store";
import { confirmWarnings } from "../../common/modals";
import { validate } from "./validate";

/**
 * A failed test must not save the configuration that produced it, but the
 * attempt is exactly what the Logs tab exists to show. So write the history on
 * its own: take the settings Flotiq already holds, swap in the current log, and
 * leave every configuration value untouched.
 *
 * Deliberately quiet - the user is already looking at the test failure, and a
 * second error toast about bookkeeping would only muddy it.
 */
const persistLogs = async (client, { getPluginSettings, setPluginSettings }) => {
    let stored = {};
    try {
        stored = JSON.parse(getPluginSettings() || "{}");
    } catch {
        stored = {};
    }

    const settings = JSON.stringify(withState(stored));

    const { body, ok } = await client["_plugin_settings"].patch(pluginInfo.id, {
        settings,
    });

    if (!ok) {
        console.error(pluginInfo.id, "saving logs", body);
        return;
    }

    // Flotiq keeps plugin settings in an in-memory register that only refreshes
    // on reload(), which this path deliberately skips to keep the modal open.
    // Without this the next open would hydrate from the value loaded at page
    // boot and the entry we just wrote would vanish from the Logs tab.
    setPluginSettings(settings);
};

const persist = async (values, client, { reload, modalInstance }, toast) => {
    const { body, ok } = await client["_plugin_settings"].patch(pluginInfo.id, {
        settings: JSON.stringify(withState(values)),
    });

    if (!ok) {
        console.error(pluginInfo.id, "saving settings", body);
        toast.error(i18n.t("Toast.SaveError"), { duration: 5000 });
        return [values, body];
    }

    toast.success(i18n.t("Toast.Saved"));
    modalInstance.resolve();
    reload();

    return [body, {}];
};

export const getSubmitHandler =
    (
        data,
        client,
        { toast, openModal, getSpaceId, getPluginSettings, setPluginSettings },
    ) =>
        async (values) => {
            // Belt and braces - onValidate already gates this, but never call the
            // worker with an incomplete configuration.
            const errors = validate(values);
            if (Object.keys(errors).length) return [values, errors];

            // Outside a space getSpaceId() is null. Sending it would put the
            // literal "null" in X-SPACE-ID and fail the worker's zod schema.
            const spaceId = getSpaceId();
            if (!spaceId) {
                console.error(pluginInfo.id, "no space in context");
                toast.error(i18n.t("Toast.SaveError"), { duration: 5000 });
                return [values, {}];
            }

            setBanner({ type: "loading", url: values.ai_url });

            const result = await testConfiguration(values, spaceId);
            const passed = result.type !== TEST_RESULT.BLOCKING;

            // The worker does not log /test calls, so the history is kept here.
            addEntry({
                type: "connection_test",
                // "succeeded"/"failed" - the vocabulary logs-view and the
                // [data-status] rules in style.css are built around.
                status: passed ? "succeeded" : "failed",
                attempts: result.attempts,
                durationMs: result.durationMs,
                message: result.messages.join(" "),
            });

            if (!passed) {
                setBanner({ type: "failed", message: result.messages.join(" ") });

                await persistLogs(client, { getPluginSettings, setPluginSettings });

                const [field, message] = fieldErrorFor(result.reason);
                return [values, { [field]: message }];
            }

            // The model answered without a usable title or alt. Worth saving,
            // but only the user can say whether it is good enough.
            if (result.type === TEST_RESULT.WARNING) {
                console.log("modelResponse:", result.response);
                const confirmed = await confirmWarnings(openModal, result.response);

                if (!confirmed) {
                    restoreBanner();
                    return [values, {}];
                }
            }

            // One timestamp for both, so the banner and the stored state cannot
            // drift apart by a few milliseconds.
            const at = new Date().toISOString();

            markConnected(at);
            setBanner({
                type: "active",
                url: values.ai_url,
                model: values.model,
                at,
            });

            return persist(values, client, data, toast);
        };
