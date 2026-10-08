import pluginInfo from "../../../plugin-manifest.json";
import i18n from "../../../i18n";
import {
    getEntries,
    getPagination,
    hasEntriesError,
    isLoadingEntries,
    subscribe,
} from "../../../common/connection-store";
import caretLeftIcon from "inline:../../../images/caret-left-icon.svg";
import caretLeftStopIcon from "inline:../../../images/caret-left-stop-icon.svg";
import caretRightIcon from "inline:../../../images/caret-right-icon.svg";
import caretRightStopIcon from "inline:../../../images/caret-right-stop-icon.svg";
import {
    addElementToCache,
    getCachedElement,
} from "../../../common/lib/plugin-element-cache";
import { openLogModal } from "../../../common/elements/log-modal";
import { loadLogsPage } from "../../../common/lib/load-logs";
import { renderLogs } from "../../../common/elements/logs-timeline";

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
