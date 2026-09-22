import i18n from "../i18n";

export const validateAiUrl = (value) => {
    const raw = (value || "").trim();

    if (!raw) return i18n.t("Validation.Required");
    if (!/^https:\/\//i.test(raw)) return i18n.t("Validation.Https");

    let parsed;
    try {
        parsed = new URL(raw);
    } catch {
        return i18n.t("Validation.InvalidUrl");
    }

    if (parsed.protocol !== "https:") return i18n.t("Validation.Https");
    if (!parsed.hostname || !parsed.hostname.includes("."))
        return i18n.t("Validation.InvalidHost");

    if (parsed.pathname === "/" || !parsed.pathname)
        return i18n.t("Validation.MissingPath");

    return null;
};

export const isValidAiUrl = (value) => validateAiUrl(value) === null;
