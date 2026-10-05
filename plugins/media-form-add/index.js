import pluginInfo from "../../plugin-manifest.json";
import i18n from "../../i18n";
import { subscribe } from "../../common/media-generation";
import {
    addElementToCache,
    getCachedElement,
} from "../../common/plugin-element-cache";
import { isConfigured, parseSettings } from "../../common/settings-parser";
import { createGenerateButton } from "./elements/generate-button";
import { generate, buttons, resumeJob } from "./lib/generation";

export const handleMediaFormAdd = (data, globals) => {
    const { contentObject } = data;
    const settings = parseSettings(globals.getPluginSettings());

    if (!contentObject?.id || !isConfigured(settings)) return null;

    const mediaId = contentObject.id;
    const key = `${pluginInfo.id}-media-form-${mediaId}`;

    const cached = getCachedElement(key);
    if (cached) {
        cached.data.ctx = data;
        cached.data.render();
        return cached.element;
    }

    const button = createGenerateButton();
    button.ctx = data;
    buttons.set(mediaId, button);

    button.element
        .querySelector(".plugin-ai-integration-media__button")
        .addEventListener("click", () => generate(button, globals));

    const unsubscribe = subscribe((id) => id === mediaId && button.render());
    i18n.on("languageChanged", button.render);

    addElementToCache(button.element, key, button, () => {
        unsubscribe();
        i18n.off("languageChanged", button.render);
        if (buttons.get(mediaId) === button) buttons.delete(mediaId);
    });

    button.render();
    resumeJob(button, globals);

    return button.element;
};
