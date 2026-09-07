import pluginInfo from "../../plugin-manifest.json";
import i18n from "../../i18n";
import { TEST_RESULT, testConfiguration } from "../../common/ai-provider";
import { confirmWarnings } from "../../common/modals";
import { addEntry, setBanner, withLogs } from "../../common/logs-store";
import { validate } from "./validate";

const persist = async (values, client, { reload, modalInstance }, toast) => {
    const { body, ok } = await client["_plugin_settings"].patch(pluginInfo.id, {
        settings: JSON.stringify(withLogs(values)),
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
    (data, client, { toast, openModal }) =>
        async (values) => {
            // Belt and braces - onValidate already gates this, but never call
            // an external endpoint with an unvalidated URL.
            const errors = validate(values);
            if (Object.keys(errors).length) return [values, errors];

            setBanner({ type: "loading", url: values.ai_url });

            const result = await testConfiguration(values);
            const succeeded = result.type !== TEST_RESULT.BLOCKING;

            addEntry({
                type: "connection_test",
                status: succeeded ? "succeeded" : "failed",
                attempts: result.attempts,
                durationMs: result.durationMs,
                message: result.messages.join(" "),
            });

            if (!succeeded) {
                setBanner({ type: "failed", message: result.messages.join(" ") });

                // 401 points at the key, everything else at the endpoint.
                const field = result.httpStatus === 401 ? "api_key" : "ai_url";
                const message =
                    result.httpStatus === 401
                        ? i18n.t("Validation.ApiKeyRejected")
                        : result.messages.join(" ");

                return [values, { [field]: message }];
            }

            setBanner({
                type: "active",
                url: values.ai_url,
                model: values.model,
                at: new Date().toISOString(),
            });

            if (result.type === TEST_RESULT.WARNING) {
                const confirmed = await confirmWarnings(openModal, result.messages);
                if (!confirmed) return [values, {}];
            }

            return persist(values, client, data, toast);
        };
