import pluginInfo from "../../plugin-manifest.json";
import { getModels, loadModels } from "../../common/models-cache";
import { getCachedElement } from "../../common/plugin-element-cache";
import { applyModelOptions } from "../manage/lib/form-schema";

const WATCHED = ["ai_url", "api_key", "flotiq_api_key"];

const syncModelField = (form) => {
    const schema = getCachedElement(`${pluginInfo.id}-form-schema`)?.element
        ?.schema;

    const { models } = getModels(
        form.getValue("ai_url"),
        form.getValue("api_key"),
    );

    if (applyModelOptions(schema, models, form.getValue("model"))) {
        form.rerenderForm();
    }
};

export const handleFormFieldListeners = (
    { name, form, contentType },
    globals,
) => {
    if (contentType?.id !== pluginInfo.id || !contentType?.nonCtdSchema) return;
    if (!WATCHED.includes(name)) return;

    const load = async () => {
        await loadModels(
            {
                ai_url: form.getValue("ai_url"),
                api_key: form.getValue("api_key"),
                flotiq_api_key: form.getValue("flotiq_api_key"),
            },
            globals.getSpaceId(),
        );

        syncModelField(form);
    };

    return {
        onBlur: load,
        onMount: load,
    };
};
