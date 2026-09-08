import pluginInfo from "../../plugin-manifest.json";
import i18n from "../../i18n";
import { getBannerElement } from "./banner";
import { getLogsView } from "./logs-view";
import {
    addElementToCache,
    getCachedElement,
} from "../../common/plugin-element-cache";

/**
 * Single element returned from `flotiq.form::add`. It holds everything above
 * the form fields (intro, banner, tab bar) plus the Logs panel, because a
 * plugin can only contribute one node to the top of the form.
 *
 * Switching to Logs hides the form fields, which are siblings rendered by
 * Flotiq after this element - see `activate()`.
 */
export const getHeader = () => {
    const key = `${pluginInfo.id}-header`;
    const cached = getCachedElement(key);
    if (cached) return cached.element;

    const wrapper = document.createElement("div");
    wrapper.className = "plugin-ai-integration-header";
    wrapper.innerHTML = /* html */ `
    <p class="plugin-ai-integration-intro"></p>
    <div class="plugin-ai-integration-banner-slot"></div>
    <div class="plugin-ai-integration-tabs" role="tablist">
      <button type="button" role="tab" data-tab="settings"
              class="plugin-ai-integration-tabs__item"></button>
      <button type="button" role="tab" data-tab="logs"
              class="plugin-ai-integration-tabs__item"></button>
    </div>
    <div class="plugin-ai-integration-panel"></div>
  `;

    wrapper
        .querySelector(".plugin-ai-integration-banner-slot")
        .appendChild(getBannerElement());

    const panel = wrapper.querySelector(".plugin-ai-integration-panel");
    const logsView = getLogsView();
    panel.appendChild(logsView);

    const activate = (tab) => {
        wrapper
            .querySelectorAll(".plugin-ai-integration-tabs__item")
            .forEach((button) => {
                button.classList.toggle("is-active", button.dataset.tab === tab);
                button.setAttribute("aria-selected", String(button.dataset.tab === tab));
            });

        panel.hidden = tab !== "logs";

        // Flotiq renders each field as a direct child of the form, next to this
        // element. Toggle one class on the form rather than writing inline styles
        // onto every sibling: restoring those would mean guessing what Flotiq had
        // set there, and "" is not a safe guess.
        wrapper
            .closest("form")
            ?.classList.toggle("plugin-ai-integration-hide-fields", tab === "logs");
    };

    wrapper
        .querySelectorAll(".plugin-ai-integration-tabs__item")
        .forEach((button) => {
            button.addEventListener("click", () => activate(button.dataset.tab));
        });

    const render = () => {
        wrapper.querySelector(".plugin-ai-integration-intro").textContent =
            i18n.t("Intro");
        wrapper.querySelector('[data-tab="settings"]').textContent =
            i18n.t("Tabs.Settings");
        wrapper.querySelector('[data-tab="logs"]').textContent = i18n.t("Tabs.Logs");
    };

    render();
    activate("settings");

    i18n.on("languageChanged", render);

    // The form is not in the DOM yet when this runs - re-apply once attached.
    wrapper.addEventListener("flotiq.attached", () => activate("settings"));

    addElementToCache(wrapper, key, {}, () =>
        i18n.off("languageChanged", render),
    );

    return wrapper;
};
