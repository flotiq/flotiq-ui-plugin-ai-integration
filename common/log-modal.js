import pluginInfo from "../plugin-manifest.json";
import i18n from "../i18n";

const modalId = `${pluginInfo.id}-log-modal`;

/** Connection tests have no media file and are not started by a person */
const isGenerationLog = (log) => !!log && log.job_id !== "test";

/** "12 August 2026, 2:22 PM" / "12 Sierpnia 2026, 14:22" */
const formatDateTime = (iso) => {
    const date = new Date(iso);
    const english = i18n.language === "en";

    const parts = new Intl.DateTimeFormat(i18n.language, {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).formatToParts(date);
    const part = (type) => parts.find((p) => p.type === type)?.value || "";

    const month = part("month");
    const time = date.toLocaleTimeString(english ? "en-US" : i18n.language, {
        hour: "numeric",
        minute: "2-digit",
        hour12: english,
    });

    return `${part("day")} ${month.charAt(0).toUpperCase()}${month.slice(1)} ${part("year")}, ${time}`;
};

const buildProperty = (labelKey, value) => {
    const row = document.createElement("div");
    row.className = "plugin-ai-integration-log-modal__property";
    row.innerHTML = /* html */ `
    <span class="plugin-ai-integration-log-modal__label"></span>
    <span class="plugin-ai-integration-log-modal__value"></span>
  `;

    row.querySelector(".plugin-ai-integration-log-modal__label").textContent =
        `${i18n.t(labelKey)}:`;
    row.querySelector(".plugin-ai-integration-log-modal__value").textContent =
        value || "-";

    return row;
};

const buildStat = (labelKey, value) => {
    const stat = document.createElement("div");
    stat.className = "plugin-ai-integration-log-modal__stat";
    stat.innerHTML = /* html */ `
    <span class="plugin-ai-integration-log-modal__stat-label"></span>
    <span class="plugin-ai-integration-log-modal__stat-value"></span>
  `;

    stat.querySelector(
        ".plugin-ai-integration-log-modal__stat-label",
    ).textContent = i18n.t(labelKey);
    stat.querySelector(
        ".plugin-ai-integration-log-modal__stat-value",
    ).textContent = value;

    return stat;
};

const buildContent = (entry, toast) => {
    const { log } = entry;

    const wrapper = document.createElement("div");
    wrapper.className =
        "plugin-ai-integration-modal plugin-ai-integration-log-modal";
    wrapper.dataset.status = entry.status;
    wrapper.innerHTML = /* html */ `
    <p class="plugin-ai-integration-log-modal__title"></p>
    <div class="plugin-ai-integration-log-modal__section plugin-ai-integration-log-modal__header">
      <div class="plugin-ai-integration-log-modal__status-row">
        <span class="plugin-ai-integration-log-modal__dot"></span>
        <span class="plugin-ai-integration-log-modal__status"></span>
        <span class="plugin-ai-integration-log-modal__date"></span>
      </div>
      <div class="plugin-ai-integration-log-modal__properties"></div>
    </div>
    <div class="plugin-ai-integration-log-modal__section">
      <p class="plugin-ai-integration-log-modal__heading"></p>
      <div class="plugin-ai-integration-log-modal__stats"></div>
      <div class="plugin-ai-integration-log-modal__subheading-row">
        <p class="plugin-ai-integration-log-modal__subheading"></p>
        <button type="button" class="plugin-ai-integration-log-modal__copy"></button>
      </div>
      <div class="plugin-ai-integration-log-modal__code">
        <pre class="plugin-ai-integration-log-modal__code-text" data-field="prompt"></pre>
      </div>
    </div>
    <div class="plugin-ai-integration-log-modal__section">
      <p class="plugin-ai-integration-log-modal__heading plugin-ai-integration-log-modal__heading--response"></p>
      <div class="plugin-ai-integration-log-modal__code">
        <pre class="plugin-ai-integration-log-modal__code-text" data-field="response"></pre>
      </div>
    </div>
  `;

    wrapper.querySelector(
        ".plugin-ai-integration-log-modal__title",
    ).textContent = i18n.t("LogModal.Title");

    wrapper.querySelector(
        ".plugin-ai-integration-log-modal__status",
    ).textContent = i18n.t(
        entry.status === "succeeded" ? "Logs.Succeeded" : "Logs.Failed",
    );

    wrapper.querySelector(
        ".plugin-ai-integration-log-modal__date",
    ).textContent = formatDateTime(entry.timestamp);

    const properties = wrapper.querySelector(
        ".plugin-ai-integration-log-modal__properties",
    );

    if (isGenerationLog(log)) {
        properties.append(
            buildProperty("LogModal.Media", log.media_id),
            buildProperty(
                "LogModal.TriggeredBy",
                // Generations logged before `trigger` existed came from the button
                i18n.t(
                    log.trigger === "auto"
                        ? "LogModal.Auto"
                        : "LogModal.Manual",
                ),
            ),
        );
    }

    properties.append(buildProperty("LogModal.Model", log?.model_name));

    wrapper.querySelector(
        ".plugin-ai-integration-log-modal__heading",
    ).textContent = i18n.t("LogModal.RequestData");

    wrapper.querySelector(".plugin-ai-integration-log-modal__stats").append(
        buildStat("LogModal.Attempts", String(entry.attempts)),
        buildStat(
            "LogModal.Duration",
            i18n.t("Logs.Duration", {
                seconds: (entry.durationMs / 1000).toFixed(1),
            }),
        ),
    );

    wrapper.querySelector(
        ".plugin-ai-integration-log-modal__subheading",
    ).textContent = i18n.t("LogModal.Prompt");
    wrapper.querySelector('[data-field="prompt"]').textContent =
        log?.prompt || "-";

    const copy = wrapper.querySelector(
        ".plugin-ai-integration-log-modal__copy",
    );
    copy.textContent = i18n.t("LogModal.Copy");
    copy.disabled = !log?.prompt;
    copy.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(log.prompt);
            toast.success(i18n.t("LogModal.Copied"));
        } catch (error) {
            console.error(pluginInfo.id, "copying the prompt", error);
        }
    });

    // A failed request has no model answer - its error is shown instead
    const failed = entry.status === "failed";

    wrapper.querySelector(
        ".plugin-ai-integration-log-modal__heading--response",
    ).textContent = i18n.t(failed ? "LogModal.Error" : "LogModal.Response");
    wrapper.querySelector('[data-field="response"]').textContent =
        (failed ? log?.errors : log?.response_raw) || "-";

    return wrapper;
};

/**
 * Details of one log entry - from the Logs tab and from the generation
 * history in the media editor.
 */
export const openLogModal = ({ openModal, toast }, entry) =>
    openModal({
        id: modalId,
        size: "md",
        hideClose: false,
        className:
            "plugin-ai-integration-dialog plugin-ai-integration-dialog--centered plugin-ai-integration-dialog--log",
        content: buildContent(entry, toast),
        buttons: [
            {
                key: "ok",
                label: i18n.t("LogModal.Ok"),
                color: "blue",
                result: true,
            },
        ],
    });
