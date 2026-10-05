import pluginInfo from "../../plugin-manifest.json";
import i18n from "../../i18n";
import infoIcon from "inline:../../images/info-icon.svg";
import {
    addElementToCache,
    getCachedElement,
} from "../../common/plugin-element-cache";
import { isOwnSettingsForm } from "../../common/settings-form";

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

export const handleFormFieldConfig = ({ name, config, contentType }) => {
    if (!isOwnSettingsForm(contentType)) return;

    if (name === "ai_url") {
        config.placeholder = "https://api.openai.com/v1/chat/completions";
    }

    if (name === "api_key" || name === "flotiq_api_key") {
        config.type = "password";
        config.autoComplete = "new-password";
    }

    if (name === "model") {
        config.placeholder = "gpt-4o-mini";
    }

    if (name === "auto_generate") {
        config.additionalElements = [getAutoGenerateLabel()];
    }
};
