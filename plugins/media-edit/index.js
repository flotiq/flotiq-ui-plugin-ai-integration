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
    getJobFields,
    isGenerating,
    RESULT,
    subscribe,
    trackJob,
} from "../../common/media-generation";
import {
    GENERATED_FIELDS,
    generationLanguage,
    isConfigured,
    isSupportedMedia,
    readSettings,
} from "../../common/media-support";
import { confirmOverwrite } from "../../common/modals";
import {
    addElementToCache,
    getCachedElement,
} from "../../common/plugin-element-cache";

const hasText = (value) => typeof value === "string" && value.trim() !== "";

/**
 * Generate buttons of the media editors open in this tab, by media id.
 * A finished job uses it to refresh the form, if the user is still editing
 * that media.
 */
const panels = new Map();

/**
 * The worker has already saved the media. Reloading it refreshes the editor,
 * and the form takes the generated values over from the reloaded media. The
 * form is reset to them unless the user has other unsaved changes (including
 * fields left out of the generation), which stay dirty to be saved as usual.
 */
const refreshForm = async (mediaId, fields) => {
    const panel = panels.get(mediaId);
    if (!panel) return;

    const { form, reloadContentObject } = panel.ctx;

    const media = await reloadContentObject().catch(() => undefined);
    if (!media || !form) return;

    const otherChanges = (form.getDirtyFields?.() || []).filter(
        (field) => !fields.includes(field),
    );

    form.setValues(
        Object.fromEntries(fields.map((field) => [field, media[field] || ""])),
    );

    if (!otherChanges.length) form.resetForm(form.getValues());
};

const startTracking = (media, settings, spaceId, globals, fields) => {
    const token = settings.flotiq_api_key;
    const name = media.fileName;

    trackJob(media.id, { token, spaceId, fields }, async (result) => {
        if (result === RESULT.SUCCESS) {
            await refreshForm(media.id, fields);
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
const resumeJob = async (panel, globals) => {
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

    // A job started elsewhere does not say which fields it writes
    if (isActiveStatus(status)) {
        startTracking(media, settings, spaceId, globals, GENERATED_FIELDS);
    }

    panel.render();
};

const generate = async (panel, globals) => {
    const { form, contentObject: media } = panel.ctx;
    const settings = readSettings(globals);

    const values = Object.fromEntries(
        GENERATED_FIELDS.map((field) => [field, form?.getValue(field)]),
    );

    let fields = GENERATED_FIELDS;

    if (GENERATED_FIELDS.some((field) => hasText(values[field]))) {
        fields = await confirmOverwrite(globals.openModal, values);
        if (!fields?.length) return;
    }

    const spaceId = globals.getSpaceId();

    panel.starting = true;
    panel.startingFields = fields;
    panel.render();

    const result = await generateMedia(settings, {
        mediaId: media.id,
        spaceId,
        language: generationLanguage(globals),
        fields,
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

    startTracking(media, settings, spaceId, globals, fields);
};

/**
 * Locks the generated fields and saving while the job runs. `lockForm` sets
 * state of the editor, so it is never called while the editor renders the
 * element.
 */
const applyLock = (panel, generating) => {
    if (panel.locked === generating) return;
    panel.locked = generating;

    const mediaId = panel.ctx.contentObject.id;
    const fields =
        (panel.starting ? panel.startingFields : getJobFields(mediaId)) ||
        GENERATED_FIELDS;

    setTimeout(() =>
        panel.ctx.lockForm?.(generating ? { fields, submit: true } : null),
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
        const supported = isSupportedMedia(media);

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
export const handleMediaFormElement = (data, globals) => {
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
        .addEventListener("click", () => generate(panel, globals));

    const unsubscribe = subscribe((id) => id === mediaId && panel.render());
    i18n.on("languageChanged", panel.render);

    addElementToCache(panel.element, key, panel, () => {
        unsubscribe();
        i18n.off("languageChanged", panel.render);
        if (panels.get(mediaId) === panel) panels.delete(mediaId);
    });

    panel.render();
    resumeJob(panel, globals);

    return panel.element;
};
