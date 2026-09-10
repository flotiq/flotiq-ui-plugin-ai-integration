import pluginInfo from "../../plugin-manifest.json";
import { loadModels } from "../../common/models-cache";

export const handleFormFieldListeners = ({ name, form, contentType }) => {
    if (contentType?.id !== pluginInfo.id || !contentType?.nonCtdSchema) return;

    if (name !== "ai_url" && name !== "api_key") return;

    const load = async () => {
        await loadModels(form.getValue("ai_url"), form.getValue("api_key"));

        form.rerenderForm();
    };

    return {
        onBlur: load,
        onMount: load,
    };
};
