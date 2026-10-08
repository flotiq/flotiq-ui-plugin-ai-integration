import pluginInfo from "../../plugin-manifest.json";
import i18n from "../../i18n";
import {
    addElementToCache,
    getCachedElement,
} from "../../common/lib/plugin-element-cache";
import { isConfigured, parseSettings } from "../../common/lib/settings-parser";
import { createHistoryPanel } from "./elements/history-panel";

export const handleSidebarPanel = (data, globals) => {
    const { contentType, contentObject, create, duplicate } = data;

    if (contentType?.name !== "_media" || create || duplicate) return null;
    if (!contentObject?.id) return null;

    const settings = parseSettings(globals.getPluginSettings());
    if (!isConfigured(settings)) return null;

    const key = `${pluginInfo.id}-history-${contentObject.id}`;

    const cached = getCachedElement(key);
    if (cached) {
        cached.data.ctx = data;
        cached.data.render();
        return cached.element;
    }

    const panel = createHistoryPanel(contentObject.id, globals);
    panel.ctx = data;

    i18n.on("languageChanged", panel.render);

    addElementToCache(panel.element, key, panel, () => {
        panel.destroy();
        i18n.off("languageChanged", panel.render);
    });

    panel.load();

    return panel.element;
};
