import pluginInfo from "../../../plugin-manifest.json";
import i18n from "../../../i18n";
import {
    getEntries,
    getPagination,
    hasEntriesError,
    isLoadingEntries,
    subscribe,
} from "../../../common/connection-store";
import logInfoIcon from "inline:../../../images/log-info-icon.svg";
import logsEmptyIcon from "inline:../../../images/logs-empty-icon.svg";
import spinnerIcon from "inline:../../../images/spinner-icon.svg";
import caretLeftIcon from "inline:../../../images/caret-left-icon.svg";
import caretLeftStopIcon from "inline:../../../images/caret-left-stop-icon.svg";
import caretRightIcon from "inline:../../../images/caret-right-icon.svg";
import caretRightStopIcon from "inline:../../../images/caret-right-stop-icon.svg";
import {
    addElementToCache,
    getCachedElement,
} from "../../../common/plugin-element-cache";
import { openLogModal } from "../../../common/log-modal";
import { loadLogsPage } from "../../manage/lib/load-logs";

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

const buildEntry = (entry, onSelect) => {
    const item = document.createElement("li");
    item.className = "plugin-ai-integration-log";
    item.dataset.status = entry.status;

    if (onSelect) {
        item.classList.add("plugin-ai-integration-log--clickable");
        item.tabIndex = 0;
        item.setAttribute("role", "button");
        item.addEventListener("click", () => onSelect(entry));
        item.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            onSelect(entry);
        });
    }

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
    <span class="plugin-ai-integration-log__info plugin-ai-integration-tip
                 plugin-ai-integration-tip--end">${logInfoIcon}</span>
  `;

    item.querySelector(".plugin-ai-integration-log__time").textContent =
        formatTimestamp(entry.timestamp);

    const statusText = i18n.t(
        entry.status === "succeeded" ? "Logs.Succeeded" : "Logs.Failed",
    );

    item.querySelector(".plugin-ai-integration-log__status").textContent =
        statusText;

    item.querySelector(".plugin-ai-integration-log__dot").dataset.tooltip =
        statusText;

    // Generation history entries have no type - every entry there is a generation
    const type = item.querySelector(".plugin-ai-integration-log__type");
    if (entry.type) type.textContent = i18n.t(TYPE_KEYS[entry.type]);
    else type.remove();

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

const buildLoadingState = () => {
    const loading = document.createElement("div");
    loading.className = "plugin-ai-integration-logs__empty";

    loading.innerHTML = /* html */ `
        <span class="plugin-ai-integration-logs__empty-icon">${spinnerIcon}</span>
        <p class="plugin-ai-integration-logs__empty-body"></p>
      `;

    loading.querySelector(
        ".plugin-ai-integration-logs__empty-body",
    ).textContent = i18n.t("Logs.Loading");

    return loading;
};

const buildErrorState = () => {
    const failed = document.createElement("div");
    failed.className = "plugin-ai-integration-logs__empty";

    failed.innerHTML = /* html */ `
    <span class="plugin-ai-integration-logs__empty-icon">${logsEmptyIcon}</span>
    <p class="plugin-ai-integration-logs__empty-body"></p>
  `;

    failed.querySelector(
        ".plugin-ai-integration-logs__empty-body",
    ).textContent = i18n.t("Logs.ErrorBody");

    return failed;
};

const DEFAULT_EMPTY = {
    icon: logsEmptyIcon,
    titleKey: "Logs.EmptyTitle",
    bodyKey: "Logs.EmptyBody",
};

const buildEmptyState = ({ icon, titleKey, bodyKey, action }) => {
    const empty = document.createElement("div");
    empty.className = "plugin-ai-integration-logs__empty";

    empty.innerHTML = /* html */ `
    <span class="plugin-ai-integration-logs__empty-icon">${icon}</span>
    <strong class="plugin-ai-integration-logs__empty-title"></strong>
    <p class="plugin-ai-integration-logs__empty-body"></p>
  `;

    empty.querySelector(
        ".plugin-ai-integration-logs__empty-title",
    ).textContent = i18n.t(titleKey);
    empty.querySelector(".plugin-ai-integration-logs__empty-body").textContent =
        i18n.t(bodyKey);

    if (action) empty.appendChild(action);

    return empty;
};

/**
 * Renders the log timeline - or the loading, error or empty state - into
 * `wrapper`. Shared by the Logs tab and the generation history in the media
 * editor, which sets its own empty state (icon, texts and an action element).
 */
export const renderLogs = (
    wrapper,
    { loading, error, entries, empty, onSelect },
) => {
    if (loading) {
        wrapper.replaceChildren(buildLoadingState());
        return;
    }

    if (!entries.length) {
        wrapper.replaceChildren(
            error
                ? buildErrorState()
                : buildEmptyState({ ...DEFAULT_EMPTY, ...empty }),
        );
        return;
    }

    const list = document.createElement("ul");
    list.className = "plugin-ai-integration-logs__list";
    entries.forEach((entry) => list.appendChild(buildEntry(entry, onSelect)));

    wrapper.replaceChildren(list);
};

/**
 * Page navigation styled like the Pagination component of Flotiq: first,
 * previous, "Page X of Y" with the number editable on click, next and last.
 */
const createPagination = () => {
    const wrapper = document.createElement("div");
    wrapper.className = "plugin-ai-integration-pagination";
    wrapper.innerHTML = /* html */ `
    <nav class="plugin-ai-integration-pagination__nav" aria-label="Pagination">
      <div class="plugin-ai-integration-pagination__group">
        <button type="button" data-go="first"
                class="plugin-ai-integration-pagination__arrow">${caretLeftStopIcon}</button>
        <button type="button" data-go="previous"
                class="plugin-ai-integration-pagination__arrow">${caretLeftIcon}</button>
      </div>
      <div class="plugin-ai-integration-pagination__pages">
        <span class="plugin-ai-integration-pagination__label"></span>
        <span class="plugin-ai-integration-pagination__current">
          <button type="button" class="plugin-ai-integration-pagination__number"></button>
          <input type="number" min="1" class="plugin-ai-integration-pagination__input" hidden />
        </span>
        <span class="plugin-ai-integration-pagination__total"></span>
      </div>
      <div class="plugin-ai-integration-pagination__group">
        <button type="button" data-go="next"
                class="plugin-ai-integration-pagination__arrow">${caretRightIcon}</button>
        <button type="button" data-go="last"
                class="plugin-ai-integration-pagination__arrow">${caretRightStopIcon}</button>
      </div>
    </nav>
  `;

    const arrows = wrapper.querySelectorAll("[data-go]");
    const number = wrapper.querySelector(
        ".plugin-ai-integration-pagination__number",
    );
    const input = wrapper.querySelector(
        ".plugin-ai-integration-pagination__input",
    );

    const goTo = (page) => {
        const { page: current, totalPages } = getPagination();
        if (page < 1 || page > totalPages || page === current) return;
        loadLogsPage(page);
    };

    const targetOf = (go) => {
        const { page, totalPages } = getPagination();
        return {
            first: 1,
            previous: page - 1,
            next: page + 1,
            last: totalPages,
        }[go];
    };

    arrows.forEach((arrow) =>
        arrow.addEventListener("click", () => goTo(targetOf(arrow.dataset.go))),
    );

    const setEditing = (editing) => {
        number.hidden = editing;
        input.hidden = !editing;

        if (editing) {
            input.value = String(getPagination().page);
            input.focus();
            input.select();
        }
    };

    const submitInput = () => {
        if (input.hidden) return;
        const page = parseInt(input.value, 10);
        setEditing(false);
        goTo(Number.isNaN(page) ? 1 : page);
    };

    number.addEventListener("click", () => setEditing(true));
    input.addEventListener("blur", submitInput);
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") submitInput();
    });

    wrapper.render = () => {
        const { page, totalPages } = getPagination();
        const loading = isLoadingEntries();

        wrapper.hidden = totalPages <= 1 || hasEntriesError();

        const titles = {
            first: "Pagination.FirstPage",
            previous: "Pagination.PreviousPage",
            next: "Pagination.NextPage",
            last: "Pagination.LastPage",
        };

        arrows.forEach((arrow) => {
            const { go } = arrow.dataset;
            const atStart = go === "first" || go === "previous";

            arrow.title = i18n.t(titles[go]);
            arrow.setAttribute("aria-label", arrow.title);
            arrow.disabled =
                loading || (atStart ? page <= 1 : page >= totalPages);
        });

        wrapper.querySelector(
            ".plugin-ai-integration-pagination__label",
        ).textContent = i18n.t("Pagination.Page");
        wrapper.querySelector(
            ".plugin-ai-integration-pagination__total",
        ).textContent = i18n.t("Pagination.NumOfPages", {
            numOfPages: totalPages,
        });

        number.textContent = String(page);
        number.disabled = loading;
        input.max = String(totalPages);
    };

    return wrapper;
};

export const getLogsView = (globals) => {
    const key = `${pluginInfo.id}-logs`;
    const cached = getCachedElement(key);
    if (cached) return cached.element;

    const view = document.createElement("div");
    view.className = "plugin-ai-integration-logs-view";

    const wrapper = document.createElement("div");
    wrapper.className = "plugin-ai-integration-logs";

    const pagination = createPagination();

    view.append(wrapper, pagination);

    const render = () => {
        renderLogs(wrapper, {
            loading: isLoadingEntries(),
            error: hasEntriesError(),
            entries: getEntries(),
            onSelect: (entry) => openLogModal(globals, entry),
        });
        pagination.render();
    };

    render();

    const unsubscribe = subscribe(render);
    i18n.on("languageChanged", render);

    addElementToCache(view, key, {}, () => {
        unsubscribe();
        i18n.off("languageChanged", render);
    });

    return view;
};
