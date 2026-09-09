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
} from "../../common/connection-store";
import { confirmWarnings } from "../../common/modals";
import { validate } from "./validate";

const persistLastTest = async (client, { getPluginSettings, setPluginSettings }) => {
    let stored;
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
        console.error(pluginInfo.id, "saving last test", body);
        return;
    }

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
            const errors = validate(values);
            if (Object.keys(errors).length) return [values, errors];

            const spaceId = getSpaceId();
            if (!spaceId) {
                console.error(pluginInfo.id, "no space in context");
                toast.error(i18n.t("Toast.SaveError"), { duration: 5000 });
                return [values, {}];
            }

            setBanner({ type: "loading", url: values.ai_url });

            const result = await testConfiguration(values, spaceId);
            const passed = result.type !== TEST_RESULT.BLOCKING;

            addEntry({
                type: "connection_test",
                status: passed ? "succeeded" : "failed",
                attempts: result.attempts,
                durationMs: result.durationMs,
                message: result.messages.join(" "),
            });

            if (!passed) {
                setBanner({ type: "failed", message: result.messages.join(" ") });

                await persistLastTest(client, { getPluginSettings, setPluginSettings });

                const [field, message] = fieldErrorFor(result.reason);
                return [values, { [field]: message }];
            }

            if (result.type === TEST_RESULT.WARNING) {
                const confirmed = await confirmWarnings(openModal, result.response);

                if (!confirmed) {
                    restoreBanner();
                    return [values, {}];
                }
            }

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
