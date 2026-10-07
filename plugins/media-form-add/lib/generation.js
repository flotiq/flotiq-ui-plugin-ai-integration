import pluginInfo from "../../../plugin-manifest.json";
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
    notifyChange,
    RESULT,
    trackJob,
} from "../../../common/media-generation";
import { confirmOverwrite } from "../../../common/overwrite-modal";
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

/** Success toast naming only the fields the job generated */
const successKeyFor = (fields) => {
    if (fields.length === 1 && fields[0] === "title")
        return "Media.Toast.SuccessTitle";
    if (fields.length === 1 && fields[0] === "alt")
        return "Media.Toast.SuccessAlt";
    return "Media.Toast.Success";
};

const startTracking = (
    media,
    settings,
    spaceId,
    globals,
    fields,
    { start, onlyWhenOpen = false } = {},
) => {
    const token = settings.flotiq_api_key;
    const name = media.fileName;

    trackJob(
        media.id,
        { token, spaceId, fields, start },
        async (result, message) => {
            if (onlyWhenOpen && !buttons.has(media.id)) {
                if (result === RESULT.START_FAILED) {
                    console.error(
                        pluginInfo.id,
                        "auto generation",
                        media.id,
                        message,
                    );
                }
                return;
            }

            if (result === RESULT.START_FAILED) {
                globals.toast.error(
                    [i18n.t("Media.Toast.StartFailed"), message]
                        .filter(Boolean)
                        .join(" "),
                    { duration: 8000 },
                );
                return;
            }

            if (result === RESULT.SUCCESS) {
                await refreshForm(media.id, fields);
                globals.toast.success(i18n.t(successKeyFor(fields), { name }));
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
        },
    );
};

export const trackAutoGeneration = (media, settings, globals) => {
    const spaceId = globals.getSpaceId();

    startTracking(media, settings, spaceId, globals, GENERATED_FIELDS, {
        start: generateMedia(settings, {
            mediaId: media.id,
            spaceId,
            language: generationLanguage(globals),
            fields: GENERATED_FIELDS,
            trigger: "auto",
        }),
        onlyWhenOpen: true,
    });
};

export const resumeJob = async (button, globals) => {
    const media = button.ctx.contentObject;
    const settings = parseSettings(globals.getPluginSettings());

    if (isGenerating(media.id) || !isConfigured(settings)) return;

    const spaceId = globals.getSpaceId();

    button.checking = true;
    notifyChange(media.id);

    const { status } = await fetchJobStatus({
        token: settings.flotiq_api_key,
        spaceId,
        mediaId: media.id,
    });

    button.checking = false;

    if (isActiveStatus(status)) {
        startTracking(media, settings, spaceId, globals, GENERATED_FIELDS);
    }

    notifyChange(media.id);
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

    // Subscribers (the SEO button and the history panel) show the request
    // as generating right away
    button.starting = true;
    button.startingFields = fields;
    notifyChange(media.id);

    const result = await generateMedia(settings, {
        mediaId: media.id,
        spaceId,
        language: generationLanguage(globals),
        fields,
        trigger: "manual",
    });

    if (!result.ok) {
        button.starting = false;
        notifyChange(media.id);
        globals.toast.error(
            [i18n.t("Media.Toast.StartFailed"), result.message]
                .filter(Boolean)
                .join(" "),
            { duration: 8000 },
        );
        return;
    }

    // The job is tracked before `starting` ends, so the state never drops to
    // "not generating" in between
    startTracking(media, settings, spaceId, globals, fields);

    button.starting = false;
    notifyChange(media.id);
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
