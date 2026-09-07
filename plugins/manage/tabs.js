import pluginInfo from "../../plugin-manifest.json";
import i18n from "../../i18n";
import { getLogsView } from "./logs-view";
import { addElementToCache, getCachedElement } from "../../common/plugin-element-cache";

export const getTabs = () => {
    const key = `${pluginInfo.id}-tabs`;
    const cached = getCachedElement(key);
    if (cached) return cached.element;

    const wrapper = document.createElement("div");
    wrapper.className = "plugin-ai-integration-tabs";
    wrapper.innerHTML = /* html */ `
    <div class="plugin-ai-integration-tabs__bar" role="tablist">
      <button type="button" role="tab" data-tab="settings"
              class="plugin-ai-integration-tabs__item"></button>
      <button type="button" role="tab" data-tab="logs"
              class="plugin-ai-integration-tabs__item"></button>
    </div>
  `;

    const logsPanel = getLogsView();
    wrapper.appendChild(logsPanel);

    const activate = (tab) => {
        wrapper.querySelectorAll(".plugin-ai-integration-tabs__item").forEach((btn) => {
            btn.classList.toggle("is-active", btn.dataset.tab === tab);
        });
        logsPanel.style.display = tab === "logs" ? "" : "none";

        // Flotiq renders the form fields after our element - toggle them as a block.
        const form = wrapper.closest("form") || document.querySelector("form");
        form?.classList.toggle("plugin-ai-integration-hide-fields", tab === "logs");
    };

    wrapper.querySelectorAll(".plugin-ai-integration-tabs__item").forEach((btn) => {
        btn.addEventListener("click", () => activate(btn.dataset.tab));
    });

    const render = () => {
        wrapper.querySelector('[data-tab="settings"]').textContent = i18n.t("Tabs.Settings");
        wrapper.querySelector('[data-tab="logs"]').textContent = i18n.t("Tabs.Logs");
    };

    render();
    i18n.on("languageChanged", render);
    activate("settings");

    addElementToCache(wrapper, key, {}, () => i18n.off("languageChanged", render));
    return wrapper;
};