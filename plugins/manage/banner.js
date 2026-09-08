import pluginInfo from "../../plugin-manifest.json";
import i18n from "../../i18n";
import { getBanner, subscribe } from "../../common/logs-store";
import {
    infoIcon,
    successIcon,
    warningIcon,
    spinnerIcon,
    chevronRightIcon,
} from "../../common/icons";
import {
    addElementToCache,
    getCachedElement,
} from "../../common/plugin-element-cache";

// TODO: point at the real integration docs once they exist.
const DOCS_URL = "https://flotiq.com/docs/";

/** Validation pins the scheme to https, so it is noise in the banner. */
const displayUrl = (url) => (url || "").replace(/^https:\/\//i, "");

// Explicit parts rather than dateStyle/timeStyle: "short" renders a two-digit
// year and 12-hour clock, which reads badly next to the URL. Locale still
// decides the separators - pl gives 28.08.2026, 11:42.
const formatDate = (iso) =>
    new Date(iso).toLocaleString(i18n.language, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

const contentFor = (banner) => {
    switch (banner.type) {
        case "loading":
            return {
                variant: "loading",
                icon: spinnerIcon,
                title: i18n.t("Banner.TestingTitle"),
                body: i18n.t("Banner.TestingBody", { url: displayUrl(banner.url) }),
            };

        case "active":
            return {
                variant: "active",
                icon: successIcon,
                title: i18n.t("Banner.ActiveTitle"),
                body: i18n.t("Banner.ActiveBody", {
                    url: displayUrl(banner.url),
                    model: banner.model,
                    date: formatDate(banner.at),
                }),
            };

        case "failed":
            return {
                variant: "failed",
                icon: warningIcon,
                title: i18n.t("Banner.FailedTitle"),
                body: banner.message,
            };

        default:
            return {
                variant: "info",
                icon: infoIcon,
                title: i18n.t("Banner.IdleTitle"),
                body: i18n.t("Banner.IdleBody"),
                link: i18n.t("Banner.DocsLink"),
            };
    }
};

export const getBannerElement = () => {
    const key = `${pluginInfo.id}-banner`;
    const cached = getCachedElement(key);
    if (cached) return cached.element;

    const wrapper = document.createElement("div");
    wrapper.className = "plugin-ai-integration-banner";
    wrapper.innerHTML = /* html */ `
    <span class="plugin-ai-integration-banner__icon"></span>
    <div class="plugin-ai-integration-banner__content">
      <strong class="plugin-ai-integration-banner__title"></strong>
      <p class="plugin-ai-integration-banner__body"></p>
      <a class="plugin-ai-integration-banner__link"
         href="${DOCS_URL}" target="_blank" rel="noopener noreferrer"
        ><span class="plugin-ai-integration-banner__link-text"></span
        >${chevronRightIcon}</a>
    </div>
  `;

    const render = () => {
        const { variant, icon, title, body, link } = contentFor(getBanner());

        wrapper.dataset.variant = variant;
        wrapper.querySelector(".plugin-ai-integration-banner__icon").innerHTML =
            icon;
        wrapper.querySelector(".plugin-ai-integration-banner__title").textContent =
            title;
        wrapper.querySelector(".plugin-ai-integration-banner__body").textContent =
            body || "";

        const anchor = wrapper.querySelector(".plugin-ai-integration-banner__link");
        // textContent on the anchor itself would wipe the chevron.
        anchor.querySelector(".plugin-ai-integration-banner__link-text").textContent =
            link || "";
        anchor.hidden = !link;
    };

    render();

    const unsubscribe = subscribe(render);
    i18n.on("languageChanged", render);

    addElementToCache(wrapper, key, {}, () => {
        unsubscribe();
        i18n.off("languageChanged", render);
    });

    return wrapper;
};
