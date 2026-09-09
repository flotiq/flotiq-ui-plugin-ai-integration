import pluginInfo from "../../plugin-manifest.json";
import i18n from "../../i18n";
import { infoIcon } from "../../common/icons";
import { getModelsState } from "../../common/models-cache";
import {
    addElementToCache,
    getCachedElement,
} from "../../common/plugin-element-cache";

/** Label + tooltip icon, rendered next to the switch instead of above it. */
const getAutoGenerateLabel = () => {
    const key = `${pluginInfo.id}-autogenerate-label`;
    const cached = getCachedElement(key);
    if (cached) return cached.element;

    const label = document.createElement("span");
    label.className = "plugin-ai-integration-toggle-label";
    label.innerHTML = /* html */ `
    <span class="plugin-ai-integration-toggle-label__text"></span>
    <span class="plugin-ai-integration-toggle-label__hint plugin-ai-integration-tip">${infoIcon}</span>
  `;

    const render = () => {
        label.querySelector(
            ".plugin-ai-integration-toggle-label__text",
        ).textContent = i18n.t("Field.AutoGenerate");

        label.querySelector(
            ".plugin-ai-integration-toggle-label__hint",
        ).dataset.tooltip = i18n.t("Field.AutoGenerateTooltip");
    };

    render();
    i18n.on("languageChanged", render);

    addElementToCache(label, key, {}, () => i18n.off("languageChanged", render));

    return label;
};

export const handleFormFieldConfig = ({ name, config, contentType, form }) => {
    // Only the settings form of THIS plugin, never a content object form.
    if (contentType?.id !== pluginInfo.id || !contentType?.nonCtdSchema) return;

    if (name === "ai_url") {
        config.placeholder = "https://api.openai.com/v1/chat/completions";
    }

    if (name === "api_key" || name === "flotiq_api_key") {
        // config accepts standard HTML input attributes
        config.type = "password";
        config.autoComplete = "new-password";
    }

    if (name === "model") {
        // Flotiq memoizes this event, so an async listing would never reach it -
        // field-listeners calls form.rerenderForm() once the fetch resolves,
        // which bumps the form counter and makes this run again with the
        // models now sitting in the cache.
        const { models } = getModelsState(
            form.getValue("ai_url"),
            form.getValue("api_key"),
        );

        config.options = models.map((model) => ({ value: model, label: model }));
    }

    if (name === "auto_generate") {
        config.additionalElements = [getAutoGenerateLabel()];
    }
};
