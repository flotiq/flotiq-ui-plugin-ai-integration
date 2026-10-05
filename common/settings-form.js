import pluginInfo from "../plugin-manifest.json";

export const isOwnSettingsForm = (contentType) =>
    contentType?.id === pluginInfo.id && !!contentType?.nonCtdSchema;
