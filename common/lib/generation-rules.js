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

export const generationLanguage = (globals) => {
    const language = globals.getLanguage();
    return LANGUAGES.includes(language) ? language : "en";
};
