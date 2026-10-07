import i18n from "../../../i18n";
import caretDownIcon from "inline:../../../images/caret-down-icon.svg";
import spinnerIcon from "inline:../../../images/spinner-icon.svg";
import starIcon from "inline:../../../images/star-icon.svg";
import { fetchMediaLogs } from "../../../common/api/ai-worker";
import { isGenerating, subscribe } from "../../../common/lib/generation-jobs";
import { isSupportedMedia } from "../../../common/lib/generation-rules";
import { openLogModal } from "../../../common/elements/log-modal";
import { parseSettings } from "../../../common/lib/settings-parser";
import { renderLogs } from "../../../common/elements/logs-timeline";
import { buttons, generate } from "../../../common/lib/generation";

const SIDEBAR_ORDER = "15";

const REFRESH_DELAY_MS = 2000;

const createGenerateAction = (panel, globals) => {
    const action = document.createElement("span");
    action.className =
        "plugin-ai-integration-history__generate plugin-ai-integration-tip";
    action.innerHTML = /* html */ `
    <button type="button" class="plugin-ai-integration-media__button">
      <span class="plugin-ai-integration-media__icon"></span>
      <span class="plugin-ai-integration-media__text"></span>
    </button>
  `;

    const button = action.querySelector("button");

    button.addEventListener("click", () => {
        const seoButton = buttons.get(panel.mediaId);
        if (seoButton) generate(seoButton, globals);
    });

    action.render = () => {
        const seoButton = buttons.get(panel.mediaId);
        const generating = isGenerating(panel.mediaId) || !!seoButton?.starting;
        const supported = isSupportedMedia(panel.ctx.contentObject);

        if (supported) delete action.dataset.tooltip;
        else action.dataset.tooltip = i18n.t("Media.UnsupportedFormat");

        button.disabled =
            !seoButton ||
            generating ||
            seoButton.checking ||
            !!seoButton.ctx.disabled ||
            !supported;
        button.dataset.loading = String(generating);

        action.querySelector(".plugin-ai-integration-media__icon").innerHTML =
            generating ? spinnerIcon : starIcon;
        action.querySelector(".plugin-ai-integration-media__text").textContent =
            i18n.t(generating ? "Media.Generating" : "History.Generate");
    };

    return action;
};

export const createHistoryPanel = (mediaId, globals) => {
    const element = document.createElement("div");
    element.className = "plugin-ai-integration-history";
    element.innerHTML = /* html */ `
    <div class="plugin-ai-integration-history__header" role="button" tabindex="0">
      <span class="plugin-ai-integration-history__title"></span>
      <span class="plugin-ai-integration-history__caret">${caretDownIcon}</span>
    </div>
    <div class="plugin-ai-integration-history__content">
      <div class="plugin-ai-integration-logs plugin-ai-integration-history__logs"></div>
      <button type="button" class="plugin-ai-integration-history__refresh"></button>
    </div>
  `;

    const header = element.querySelector(
        ".plugin-ai-integration-history__header",
    );
    const content = element.querySelector(
        ".plugin-ai-integration-history__content",
    );
    const logs = element.querySelector(".plugin-ai-integration-history__logs");
    const refresh = element.querySelector(
        ".plugin-ai-integration-history__refresh",
    );

    const panel = {
        element,
        mediaId,
        ctx: {},
        open: true,
        state: { loading: true, error: false, entries: [] },
    };

    const generateAction = createGenerateAction(panel, globals);

    panel.render = () => {
        element.querySelector(
            ".plugin-ai-integration-history__title",
        ).textContent = i18n.t("History.Title");

        element.dataset.open = String(panel.open);
        header.setAttribute("aria-expanded", String(panel.open));
        content.hidden = !panel.open;

        generateAction.render();

        renderLogs(logs, {
            ...panel.state,
            empty: {
                icon: starIcon,
                titleKey: "History.EmptyTitle",
                bodyKey: "History.EmptyBody",
                action: generateAction,
            },
            onSelect: (entry) => openLogModal(globals, entry),
        });

        refresh.textContent = i18n.t("History.Refresh");
        refresh.disabled = panel.state.loading;
    };

    let generation = 0;

    panel.load = async () => {
        const current = ++generation;
        const settings = parseSettings(globals.getPluginSettings());

        panel.state = { ...panel.state, loading: true };
        panel.render();

        const { ok, entries } = await fetchMediaLogs({
            token: settings.flotiq_api_key,
            spaceId: globals.getSpaceId(),
            mediaId,
        });

        if (current !== generation) return;

        panel.state = { loading: false, error: !ok, entries };
        panel.render();
    };

    const toggle = () => {
        panel.open = !panel.open;
        panel.render();
    };

    header.addEventListener("click", toggle);
    header.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        toggle();
    });

    refresh.addEventListener("click", panel.load);

    element.addEventListener("flotiq.attached", () => {
        if (element.parentElement) {
            element.parentElement.style.order = SIDEBAR_ORDER;
        }
    });

    const isRunning = () =>
        isGenerating(mediaId) || !!buttons.get(mediaId)?.starting;

    let wasRunning = isRunning();

    const unsubscribe = subscribe((id) => {
        if (id !== mediaId) return;

        const running = isRunning();
        if (wasRunning && !running) setTimeout(panel.load, REFRESH_DELAY_MS);
        wasRunning = running;

        panel.render();
    });

    panel.destroy = unsubscribe;

    return panel;
};
