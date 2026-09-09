import pluginInfo from "../../plugin-manifest.json";
import i18n from "../../i18n";
import { getEntries, subscribe } from "../../common/connection-store";
import { logInfoIcon, logsEmptyIcon } from "../../common/icons";
import {
    addElementToCache,
    getCachedElement,
} from "../../common/plugin-element-cache";

const TYPE_KEYS = {
    connection_test: "Logs.ConnectionTest",
    auto_generate: "Logs.AutoGenerate",
    manual_generation: "Logs.ManualGeneration",
};

const formatTimestamp = (iso) => {
    const date = new Date(iso);
    const isToday = date.toDateString() === new Date().toDateString();

    const time = date.toLocaleTimeString(i18n.language, {
        hour: "2-digit",
        minute: "2-digit",
    });

    if (isToday) return `${i18n.t("Logs.Today")}, ${time}`;

    const day = date.toLocaleDateString(i18n.language, {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    return `${day}, ${time}`;
};

const buildEntry = (entry) => {
    const item = document.createElement("li");
    item.className = "plugin-ai-integration-log";
    item.dataset.status = entry.status;

    const seconds = (entry.durationMs / 1000).toFixed(1);

    item.innerHTML = /* html */ `
    <span class="plugin-ai-integration-log__dot plugin-ai-integration-tip plugin-ai-integration-tip--start"></span>
    <div class="plugin-ai-integration-log__content">
      <span class="plugin-ai-integration-log__time"></span>
      <div class="plugin-ai-integration-log__row">
        <strong class="plugin-ai-integration-log__status"></strong>
        <span class="plugin-ai-integration-log__separator">·</span>
        <span class="plugin-ai-integration-log__type"></span>
        <span class="plugin-ai-integration-log__meta"></span>
      </div>
    </div>
    <span class="plugin-ai-integration-log__info plugin-ai-integration-tip plugin-ai-integration-tip--end">${logInfoIcon}</span>
  `;

    item.querySelector(".plugin-ai-integration-log__time").textContent =
        formatTimestamp(entry.timestamp);

    const statusText = i18n.t(
        entry.status === "succeeded" ? "Logs.Succeeded" : "Logs.Failed",
    );

    item.querySelector(".plugin-ai-integration-log__status").textContent = statusText;

    item.querySelector(".plugin-ai-integration-log__dot").dataset.tooltip =
        statusText;

    item.querySelector(".plugin-ai-integration-log__type").textContent = i18n.t(
        TYPE_KEYS[entry.type] || TYPE_KEYS.connection_test,
    );

    item.querySelector(".plugin-ai-integration-log__meta").textContent =
        `${i18n.t("Logs.Attempts", { count: entry.attempts })} · ${i18n.t("Logs.Duration", { seconds })}`;

    item.querySelector(".plugin-ai-integration-log__info").dataset.tooltip = [
        new Date(entry.timestamp).toLocaleString(i18n.language),
        entry.message,
    ]
        .filter(Boolean)
        .join("\n");

    return item;
};

const buildEmptyState = () => {
    const empty = document.createElement("div");
    empty.className = "plugin-ai-integration-logs__empty";

    empty.innerHTML = /* html */ `
    <span class="plugin-ai-integration-logs__empty-icon">${logsEmptyIcon}</span>
    <strong class="plugin-ai-integration-logs__empty-title"></strong>
    <p class="plugin-ai-integration-logs__empty-body"></p>
  `;

    empty.querySelector(".plugin-ai-integration-logs__empty-title").textContent =
        i18n.t("Logs.EmptyTitle");
    empty.querySelector(".plugin-ai-integration-logs__empty-body").textContent =
        i18n.t("Logs.EmptyBody");

    return empty;
};

export const getLogsView = () => {
    const key = `${pluginInfo.id}-logs`;
    const cached = getCachedElement(key);
    if (cached) return cached.element;

    const wrapper = document.createElement("div");
    wrapper.className = "plugin-ai-integration-logs";

    const render = () => {
        const entries = getEntries();

        if (!entries.length) {
            wrapper.replaceChildren(buildEmptyState());
            return;
        }

        const list = document.createElement("ul");
        list.className = "plugin-ai-integration-logs__list";
        entries.forEach((entry) => list.appendChild(buildEntry(entry)));

        wrapper.replaceChildren(list);
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
