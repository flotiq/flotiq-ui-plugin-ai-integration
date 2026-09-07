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
                    model: { type: "string", minLength: 1 },
                    auto_generate: { type: "boolean" },
                    // Persisted alongside the settings, never rendered as a field.
                    // logs: { type: "array" },
                },
            },
        ],
        required: ["ai_url", "api_key", "model"],
        additionalProperties: false,
    },
    metaDefinition: {
        // `logs` is intentionally absent - anything not in `order` is not rendered.
        order: ["ai_url", "api_key", "model", "auto_generate"],
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
            model: {
                label: i18n.t("Field.Model"),
                helpText: "",
                unique: false,
                inputType: "select",
                useOptionsWithLabels: false,
                // Filled in dynamically from /models - see field-config.js.
                options: [],
            },
            auto_generate: {
                label: "",
                helpText: "",
                unique: false,
                inputType: "checkbox",
            },
            // logs: {
            //     label: "",
            //     helpText: "",
            //     unique: false,
            //     inputType: "text",
            // },
        },
    },
});
