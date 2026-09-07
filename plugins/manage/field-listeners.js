import pluginInfo from "../../plugin-manifest.json";
import { invalidateModels, loadModels } from "../../common/models-cache";

export const handleFormFieldListeners = ({ name, form, contentType }) => {
    if (contentType?.id !== pluginInfo.id || !contentType?.nonCtdSchema) return;

    if (name !== "ai_url" && name !== "api_key") return;

    return {
        // Repaints the status line while typing - the cache is keyed by the
        // (url, key) pair, so nothing needs clearing.
        onChange: () => invalidateModels(),
        onBlur: () => {
            loadModels(form.getValue("ai_url"), form.getValue("api_key"));
        },
    };
};
