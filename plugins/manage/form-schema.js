import pluginInfo from "../../plugin-manifest.json";
import i18n from "../../i18n";

export const getSchema = () => ({
    id: pluginInfo.id,
    name: "ai_integration_settings",
    label: "AI integration",
    internal: false,
    schemaDefinition: {
        type: "object",
        allOf: [
            { $ref: "#/components/schemas/AbstractContentTypeSchemaDefinition" },
            {
                type: "object",
                properties: {
                    ai_url: { type: "string", minLength: 1 },
                    api_key: { type: "string", minLength: 1 },
                    flotiq_api_key: { type: "string", minLength: 1 },
                    model: { type: "string", minLength: 1 },
                    auto_generate: { type: "boolean" },
                },
            },
        ],
        required: ["ai_url", "api_key", "flotiq_api_key", "model"],
        // Connection test history is persisted alongside these values under
        // `logs` without being a form field - see common/logs-store.js.
        additionalProperties: true,
    },
    metaDefinition: {
        order: ["ai_url", "api_key", "flotiq_api_key", "model", "auto_generate"],
        propertiesConfig: {
            ai_url: {
                label: i18n.t("Field.EndpointUrl"),
                helpText: i18n.t("Field.EndpointUrlHelp"),
                unique: false,
                inputType: "text",
            },
            api_key: {
                label: i18n.t("Field.ApiKey"),
                helpText: i18n.t("Field.ApiKeyHelp"),
                unique: false,
                // Turned into <input type="password"> in field::config.
                inputType: "text",
            },
            flotiq_api_key: {
                label: i18n.t("Field.FlotiqApiKey"),
                helpText: i18n.t("Field.FlotiqApiKeyHelp"),
                unique: false,
                // Turned into <input type="password"> in field::config.
                inputType: "text",
            },
            model: {
                label: i18n.t("Field.Model"),
                unique: false,
                inputType: "select",
                // Filled in by field-config once the provider listing resolves.
                options: [],
            },
            auto_generate: {
                // Rendered by our own element next to the switch, see field-config.
                label: "",
                helpText: "",
                unique: false,
                inputType: "checkbox",
            },
        },
    },
});
