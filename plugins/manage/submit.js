import pluginInfo from "../../plugin-manifest.json";
import i18n from "../../i18n";
import { TEST_RESULT, testConfiguration } from "../../common/ai-worker";
import { fieldErrorFor } from "../../common/ai-worker-helpers";
import {
    markConnected,
    restoreBanner,
    setBanner,
    withState,
} from "../../common/connection-store";
import { confirmWarnings } from "../../common/modals";
import { loadLogs } from "./load-logs";
import { validate } from "./validate";

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
        { toast, openModal, getSpaceId },
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

            loadLogs(values.flotiq_api_key, spaceId);

            if (!passed) {
                setBanner({ type: "failed", message: result.messages.join(" ") });

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
