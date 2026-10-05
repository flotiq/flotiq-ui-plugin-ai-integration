/** Formats accepted by the worker */
const SUPPORTED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/svg+xml",
];

export const GENERATED_FIELDS = ["title", "alt"];

const LANGUAGES = ["pl", "en"];

export const isSupportedMedia = (media) =>
    SUPPORTED_MIME_TYPES.includes(media?.mimeType);

export const readSettings = (globals) => {
    try {
        return JSON.parse(globals.getPluginSettings() || "{}");
    } catch {
        return {};
    }
};

export const isConfigured = (settings) =>
    settings.connection?.status === "active" &&
    !!(
        settings.ai_url &&
        settings.api_key &&
        settings.model &&
        settings.flotiq_api_key
    );

/** Language of the user's account, as the worker accepts it */
export const generationLanguage = (globals) => {
    const language = globals.getLanguage();
    return LANGUAGES.includes(language) ? language : "en";
};
