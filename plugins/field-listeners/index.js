import pluginInfo from "../../plugin-manifest.json";
import { modelFromUrl } from "../../common/model-in-url";
import { getModels, loadModels } from "../../common/models-cache";
import { getCachedElement } from "../../common/plugin-element-cache";
import { applyModelOptions } from "../manage/lib/form-schema";

const TRIMMED = ["ai_url", "api_key", "flotiq_api_key", "model"];
const WATCHED = ["ai_url", "api_key", "flotiq_api_key"];

const syncModelField = (form) => {
    const schema = getCachedElement(`${pluginInfo.id}-form-schema`)?.element
        ?.schema;

    const aiUrl = form.getValue("ai_url");
    const pathModel = modelFromUrl(aiUrl);

    if (pathModel) {
        if (form.getValue("model") !== pathModel) {
            form.setFieldValue("model", pathModel);
        }

        if (applyModelOptions(schema, [], pathModel, true)) {
            form.rerenderForm();
        }

        return;
    }

    const { models } = getModels(aiUrl, form.getValue("api_key"));

    if (applyModelOptions(schema, models, form.getValue("model"))) {
        form.rerenderForm();
    }
};

export const handleFormFieldListeners = (
    { name, form, contentType },
    globals,
) => {
    if (contentType?.id !== pluginInfo.id || !contentType?.nonCtdSchema) return;
    if (!TRIMMED.includes(name)) return;

    const trim = () => {
        const value = form.getValue(name);

        if (typeof value === "string" && value !== value.trim()) {
            form.setFieldValue(name, value.trim());
        }
    };

    if (!WATCHED.includes(name)) return { onBlur: trim };

    const load = async () => {
        trim();

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
