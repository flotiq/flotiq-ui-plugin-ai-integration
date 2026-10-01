import pluginInfo from "../../plugin-manifest.json";
import i18n from "../../i18n";
import {
    fetchJobError,
    fetchJobStatus,
    generateMedia,
    isActiveStatus,
} from "../../common/ai-worker";
import { spinnerIcon, starIcon } from "../../common/icons";
import {
    isGenerating,
    RESULT,
    subscribe,
    trackJob,
} from "../../common/media-generation";
import { confirmOverwrite } from "../../common/modals";
import {
    addElementToCache,
    getCachedElement,
} from "../../common/plugin-element-cache";

/** Formats accepted by the worker */
const SUPPORTED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/svg+xml",
];

const GENERATED_FIELDS = ["title", "alt"];

const LANGUAGES = ["pl", "en"];

const readSettings = (globals) => {
    try {
        return JSON.parse(globals.getPluginSettings() || "{}");
    } catch {
        return {};
    }
};

const isConfigured = (settings) =>
    settings.connection?.status === "active" &&
    !!(
        settings.ai_url &&
        settings.api_key &&
        settings.model &&
        settings.flotiq_api_key
    );

const hasText = (value) => typeof value === "string" && value.trim() !== "";

/**
 * Generate buttons of the media editors open in this tab, by media id.
 * A finished job uses it to refresh the form, if the user is still editing
 * that media.
 */
const panels = new Map();

/**
 * The worker has already saved the media - the form only takes the new values
 * over. It is reset to them unless the user has other unsaved changes, which
 * stay dirty to be saved as usual.
 */
const refreshForm = async (mediaId, client) => {
    const panel = panels.get(mediaId);
    if (!panel) return;

    const { form, reloadContentObject } = panel.ctx;

    const { body, ok } = await client._media
        .get(mediaId)
        .catch(() => ({ ok: false }));

    if (ok && form) {
        const otherChanges = (form.getDirtyFields?.() || []).filter(
            (field) => !GENERATED_FIELDS.includes(field),
        );

        form.setValues({ title: body.title || "", alt: body.alt || "" });

        if (!otherChanges.length) form.resetForm(form.getValues());
    }

    await reloadContentObject?.();
};

const startTracking = (media, settings, spaceId, client, globals) => {
    const token = settings.flotiq_api_key;
    const name = media.fileName;

    trackJob(media.id, { token, spaceId }, async (result) => {
        if (result === RESULT.SUCCESS) {
            await refreshForm(media.id, client);
            globals.toast.success(i18n.t("Media.Toast.Success", { name }));
            return;
        }

        if (result === RESULT.TIMEOUT) {
            globals.toast.error(i18n.t("Media.Toast.Timeout", { name }), {
                duration: 8000,
            });
            return;
        }

        const reason = await fetchJobError({
            token,
            spaceId,
            mediaId: media.id,
        });

        globals.toast.error(
            [i18n.t("Media.Toast.Failed", { name }), reason]
                .filter(Boolean)
                .join(" "),
            { duration: 8000 },
        );
    });
};

/**
 * Picks up a job started elsewhere - auto generation after upload, another
 * tab or a reload of the page.
 */
const resumeJob = async (panel, client, globals) => {
    const media = panel.ctx.contentObject;
    const settings = readSettings(globals);

    if (isGenerating(media.id) || !isConfigured(settings)) return;

    const spaceId = globals.getSpaceId();

    panel.checking = true;
    panel.render();

    const { status } = await fetchJobStatus({
        token: settings.flotiq_api_key,
        spaceId,
        mediaId: media.id,
    });

    panel.checking = false;

    if (isActiveStatus(status)) {
        startTracking(media, settings, spaceId, client, globals);
    }

    panel.render();
};

const generate = async (panel, client, globals) => {
    const { form, contentObject: media } = panel.ctx;
    const settings = readSettings(globals);

    const filled = GENERATED_FIELDS.some((field) =>
        hasText(form?.getValue(field)),
    );

    if (filled && !(await confirmOverwrite(globals.openModal))) return;

    const spaceId = globals.getSpaceId();
    const language = globals.getLanguage();

    panel.starting = true;
    panel.render();

    const result = await generateMedia(settings, {
        mediaId: media.id,
        spaceId,
        language: LANGUAGES.includes(language) ? language : "en",
    });

    panel.starting = false;

    if (!result.ok) {
        panel.render();
        globals.toast.error(
            [i18n.t("Media.Toast.StartFailed"), result.message]
                .filter(Boolean)
                .join(" "),
            { duration: 8000 },
        );
        return;
    }

    startTracking(media, settings, spaceId, client, globals);
};

/**
 * Locks title, alt and saving while the job runs. `lockForm` sets state of
 * the editor, so it is never called while the editor renders the element.
 */
const applyLock = (panel, generating) => {
    if (panel.locked === generating) return;
    panel.locked = generating;

    setTimeout(() =>
        panel.ctx.lockForm?.(
            generating ? { fields: GENERATED_FIELDS, submit: true } : null,
        ),
    );
};

const createPanel = () => {
    const element = document.createElement("div");
    element.className = "plugin-ai-integration-media";
    element.innerHTML = /* html */ `
    <span class="plugin-ai-integration-media__label"></span>
    <span class="plugin-ai-integration-media__tip plugin-ai-integration-tip">
      <button type="button" class="plugin-ai-integration-media__button">
        <span class="plugin-ai-integration-media__icon"></span>
        <span class="plugin-ai-integration-media__text"></span>
      </button>
    </span>
  `;

    const panel = {
        element,
        ctx: {},
        starting: false,
        checking: false,
        locked: false,
    };

    panel.render = () => {
        const media = panel.ctx.contentObject;
        const generating = isGenerating(media.id) || panel.starting;
        const supported = SUPPORTED_MIME_TYPES.includes(media.mimeType);

        element.querySelector(
            ".plugin-ai-integration-media__label",
        ).textContent = i18n.t("Media.Label");

        const tip = element.querySelector(".plugin-ai-integration-media__tip");
        if (supported) delete tip.dataset.tooltip;
        else tip.dataset.tooltip = i18n.t("Media.UnsupportedFormat");

        const button = element.querySelector(
            ".plugin-ai-integration-media__button",
        );
        button.disabled =
            generating || panel.checking || !!panel.ctx.disabled || !supported;
        button.dataset.loading = String(generating);

        element.querySelector(".plugin-ai-integration-media__icon").innerHTML =
            generating ? spinnerIcon : starIcon;

        element.querySelector(
            ".plugin-ai-integration-media__text",
        ).textContent = i18n.t(
            generating ? "Media.Generating" : "Media.Generate",
        );

        applyLock(panel, generating);
    };

    return panel;
};

/**
 * Renders the generate button in the media form, between the file name and
 * the title. Nothing is rendered until the integration is configured.
 */
export const handleMediaFormElement = (data, client, globals) => {
    const { contentObject } = data;

    if (!contentObject?.id || !isConfigured(readSettings(globals))) return null;

    const mediaId = contentObject.id;
    const key = `${pluginInfo.id}-media-form-${mediaId}`;

    const cached = getCachedElement(key);
    if (cached) {
        cached.data.ctx = data;
        cached.data.render();
        return cached.element;
    }

    const panel = createPanel();
    panel.ctx = data;
    panels.set(mediaId, panel);

    panel.element
        .querySelector(".plugin-ai-integration-media__button")
        .addEventListener("click", () => generate(panel, client, globals));

    const unsubscribe = subscribe((id) => id === mediaId && panel.render());
    i18n.on("languageChanged", panel.render);

    addElementToCache(panel.element, key, panel, () => {
        unsubscribe();
        i18n.off("languageChanged", panel.render);
        if (panels.get(mediaId) === panel) panels.delete(mediaId);
    });

    panel.render();
    resumeJob(panel, client, globals);

    return panel.element;
};
