export const parseSettings = (pluginSettings) => {
    try {
        return JSON.parse(pluginSettings || "{}");
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
