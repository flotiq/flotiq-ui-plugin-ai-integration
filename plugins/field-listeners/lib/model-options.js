import i18n from "../../../i18n";

export const applyModelOptions = (schema, models, current, fromUrl = false) => {
    const config = schema?.metaDefinition?.propertiesConfig?.model;
    if (!config) return false;

    const useSelect =
        !fromUrl && models.length > 0 && (!current || models.includes(current));

    const inputType = useSelect ? "select" : "text";
    const options = useSelect ? models : [];
    const helpText = fromUrl ? i18n.t("Field.ModelFromUrl") : "";

    const currentOptions = config.options || [];

    const unchanged =
        config.inputType === inputType &&
        (config.helpText || "") === helpText &&
        currentOptions.length === options.length &&
        currentOptions.every((value, index) => value === options[index]);

    if (unchanged) return false;

    config.inputType = inputType;
    config.options = options;
    config.helpText = helpText;

    return true;
};
