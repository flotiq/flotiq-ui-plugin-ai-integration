import pluginInfo from "../../plugin-manifest.json";
import i18n from "../../i18n";
import { getBanner, subscribe } from "../../common/logs-store";
import {
    infoIcon,
    successIcon,
    warningIcon,
    spinnerIcon,
} from "../../common/icons";
import {
    addElementToCache,
    getCachedElement,
} from "../../common/plugin-element-cache";

// TODO: point at the real integration docs once they exist.
const DOCS_URL = "https://flotiq.com/docs/";

const formatDate = (iso) =>
    new Date(iso).toLocaleString(i18n.language, {
        dateStyle: "short",
        timeStyle: "short",
    });

const contentFor = (banner) => {
    switch (banner.type) {
        case "loading":
            return {
                variant: "loading",
                icon: spinnerIcon,
                title: i18n.t("Banner.TestingTitle"),
                body: i18n.t("Banner.TestingBody", { url: banner.url }),
            };

        case "active":
            return {
                variant: "active",
                icon: successIcon,
                title: i18n.t("Banner.ActiveTitle"),
                body: i18n.t("Banner.ActiveBody", {
                    url: banner.url,
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
                link: `${i18n.t("Banner.DocsLink")} >`,
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
         href="${DOCS_URL}" target="_blank" rel="noopener noreferrer"></a>
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
        anchor.textContent = link || "";
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
