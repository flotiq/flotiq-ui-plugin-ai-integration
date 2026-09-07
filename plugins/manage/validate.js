import i18n from "../../i18n";
import { validateAiUrl } from "../../common/validate-url";

/**
 * Runs on every form change. Returning a non-empty object blocks submit,
 * so /test is never called with an invalid URL.
 */
export const validate = (values) => {
    const errors = {};

    const urlError = validateAiUrl(values.ai_url);
    if (urlError) errors.ai_url = urlError;

    if (!values.api_key?.trim()) errors.api_key = i18n.t("Validation.Required");
    if (!values.model?.trim()) errors.model = i18n.t("Validation.Required");

    return errors;
};
