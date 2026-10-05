import i18n from "../../../i18n";
import {
    fetchJobError,
    fetchJobStatus,
    generateMedia,
    isActiveStatus,
} from "../../../common/ai-worker";
import {
    GENERATED_FIELDS,
    generationLanguage,
    getJobFields,
    isGenerating,
    RESULT,
    trackJob,
} from "../../../common/media-generation";
import { confirmOverwrite } from "../../../common/modals";
import { isConfigured, parseSettings } from "../../../common/settings-parser";

const hasText = (value) => typeof value === "string" && value.trim() !== "";

export const buttons = new Map();

const refreshForm = async (mediaId, fields) => {
    const button = buttons.get(mediaId);
    if (!button) return;

    const { form, reloadContentObject } = button.ctx;

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

export const resumeJob = async (button, globals) => {
    const media = button.ctx.contentObject;
    const settings = parseSettings(globals.getPluginSettings());

    if (isGenerating(media.id) || !isConfigured(settings)) return;

    const spaceId = globals.getSpaceId();

    button.checking = true;
    button.render();

    const { status } = await fetchJobStatus({
        token: settings.flotiq_api_key,
        spaceId,
        mediaId: media.id,
    });

    button.checking = false;

    if (isActiveStatus(status)) {
        startTracking(media, settings, spaceId, globals, GENERATED_FIELDS);
    }

    button.render();
};

export const generate = async (button, globals) => {
    const { form, contentObject: media } = button.ctx;
    const settings = parseSettings(globals.getPluginSettings());

    const values = Object.fromEntries(
        GENERATED_FIELDS.map((field) => [field, form?.getValue(field)]),
    );

    let fields = GENERATED_FIELDS;

    if (GENERATED_FIELDS.some((field) => hasText(values[field]))) {
        fields = await confirmOverwrite(globals.openModal, values);
        if (!fields?.length) return;
    }

    const spaceId = globals.getSpaceId();

    button.starting = true;
    button.startingFields = fields;
    button.render();

    const result = await generateMedia(settings, {
        mediaId: media.id,
        spaceId,
        language: generationLanguage(globals),
        fields,
    });

    button.starting = false;

    if (!result.ok) {
        button.render();
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

export const applyLock = (button, generating) => {
    if (button.locked === generating) return;
    button.locked = generating;

    const mediaId = button.ctx.contentObject.id;
    const fields =
        (button.starting ? button.startingFields : getJobFields(mediaId)) ||
        GENERATED_FIELDS;

    setTimeout(() =>
        button.ctx.lockForm?.(generating ? { fields, submit: true } : null),
    );
};
