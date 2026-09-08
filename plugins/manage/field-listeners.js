import pluginInfo from "../../plugin-manifest.json";
import { loadModels } from "../../common/models-cache";

export const handleFormFieldListeners = ({ name, form, contentType }) => {
    if (contentType?.id !== pluginInfo.id || !contentType?.nonCtdSchema) return;

    if (name !== "ai_url" && name !== "api_key") return;

    const load = async () => {
        await loadModels(form.getValue("ai_url"), form.getValue("api_key"));

        // The only way to get the freshly loaded models into the model field:
        // it reads them in `field::config`, which Flotiq memoizes until the
        // form counter changes.
        form.rerenderForm();
    };

    return {
        onBlur: load,
        // Settings saved earlier arrive with the form already filled in.
        onMount: load,
    };
};
