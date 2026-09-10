import pluginInfo from "../../plugin-manifest.json";
import {
    addElementToCache,
    getCachedElement,
    removeElement,
} from "../../common/plugin-element-cache";
import { hydrate } from "../../common/connection-store";
import { loadLogs } from "./load-logs";
import { getSchema } from "./form-schema";
import { getSubmitHandler } from "./submit";
import { validate } from "./validate";

export const handleManageSchema = (data, client, globals) => {
    const cacheKey = `${pluginInfo.id}-form-schema`;
    let formSchema = getCachedElement(cacheKey)?.element;

    if (!formSchema) {
        let settings;
        try {
            settings = JSON.parse(globals.getPluginSettings() || "{}");
        } catch {
            settings = {};
        }

        hydrate(settings);

        loadLogs(settings.flotiq_api_key, globals.getSpaceId());

        formSchema = {
            schema: getSchema(),
            options: {
                disabledBuildInValidation: true,
                onValidate: validate,
                onSubmit: getSubmitHandler(data, client, globals),
            },
        };

        addElementToCache(formSchema, cacheKey);
    }

    data.modalInstance.promise.then(() => removeElement(cacheKey));

    return formSchema;
};
