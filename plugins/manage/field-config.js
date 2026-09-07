import pluginInfo from "../../plugin-manifest.json";
import i18n from "../../i18n";
import { infoIcon } from "../../common/icons";
import {
    addElementToCache,
    getCachedElement,
} from "../../common/plugin-element-cache";
import {
    getModelsState,
    loadModels,
    subscribeToModels,
} from "../../common/models-cache";

/**
 * Status line under the Model select. It also triggers a form rerender when
 * the model list arrives, because `config.options` is only read while the
 * field is being rendered.
 */
const getModelStatus = (form) => {
    const key = `${pluginInfo.id}-model-status`;
    const cached = getCachedElement(key);

    if (cached) {
        cached.data.form = form;
        return cached.element;
    }

    const status = document.createElement("span");
    status.className = "plugin-ai-integration-model__status";

    const data = { form, lastStatus: null };

    const render = () => {
        const aiUrl = data.form.getValue("ai_url");
        const apiKey = data.form.getValue("api_key");
        const state = getModelsState(aiUrl, apiKey);

        status.dataset.state = state.status;

        if (state.status === "loading") {
            status.textContent = i18n.t("Models.Loading");
        } else if (state.status === "error") {
            status.textContent = i18n.t("Models.Error", { error: state.error });
        } else if (state.status === "loaded") {
            status.textContent = i18n.t("Models.Loaded", {
                count: state.models.length,
            });
        } else {
            status.textContent = i18n.t("Models.Idle");
        }

        // Options are baked into the select on render, so a fresh list needs a
        // rerender. Guarded by the previous status to avoid a render loop.
        if (state.status === "loaded" && data.lastStatus !== "loaded") {
            data.lastStatus = state.status;
            data.form.rerenderForm?.();
            return;
        }

        data.lastStatus = state.status;
    };

    render();

    const unsubscribe = subscribeToModels(render);
    i18n.on("languageChanged", render);

    addElementToCache(status, key, data, () => {
        unsubscribe();
        i18n.off("languageChanged", render);
    });

    return status;
};

/** Label + tooltip icon, rendered next to the switch instead of above it. */
const getAutoGenerateLabel = () => {
    const key = `${pluginInfo.id}-autogenerate-label`;
    const cached = getCachedElement(key);
    if (cached) return cached.element;

    const label = document.createElement("span");
    label.className = "plugin-ai-integration-toggle-label";
    label.innerHTML = /* html */ `
      <span class="plugin-ai-integration-toggle-label__text"></span>
      <span class="plugin-ai-integration-toggle-label__hint">${infoIcon}</span>
    `;

    const render = () => {
        label.querySelector(".plugin-ai-integration-toggle-label__text").textContent =
            i18n.t("Field.AutoGenerate");
        label.querySelector(".plugin-ai-integration-toggle-label__hint").title =
            i18n.t("Field.AutoGenerateTooltip");
    };

    render();
    i18n.on("languageChanged", render);

    addElementToCache(label, key, {}, () => i18n.off("languageChanged", render));

    return label;
};

export const handleFormFieldConfig = ({ name, config, form, contentType }) => {
    // Only the settings form of THIS plugin, never a content object form.
    if (contentType?.id !== pluginInfo.id || !contentType?.nonCtdSchema) return;

    if (name === "ai_url") {
        config.placeholder = "https://api.openai.com/v1";
    }

    if (name === "api_key") {
        // config accepts standard HTML input attributes
        config.type = "password";
        config.autoComplete = "new-password";
    }

    if (name === "model") {
        const aiUrl = form.getValue("ai_url");
        const apiKey = form.getValue("api_key");

        config.options = getModelsState(aiUrl, apiKey).models;
        config.additionalElements = [getModelStatus(form)];

        // Kick off the fetch when the form opens with values already saved.
        loadModels(aiUrl, apiKey);
    }

    if (name === "auto_generate") {
        config.additionalElements = [getAutoGenerateLabel()];
    }
};
