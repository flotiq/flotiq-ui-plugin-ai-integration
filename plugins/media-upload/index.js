import pluginInfo from "../../plugin-manifest.json";
import { generateMedia } from "../../common/ai-worker";
import {
    GENERATED_FIELDS,
    generationLanguage,
    isConfigured,
    isSupportedMedia,
    readSettings,
} from "../../common/media-support";

/**
 * Auto generation: starts generating title and alt right after a file is
 * uploaded, when `auto_generate` is on. Nothing is shown and the upload is not
 * held up - the worker saves the result to the media, and the media editor
 * picks a running job up when the file is opened.
 */
export const handleMediaUpload = async ({ media }, globals) => {
    const settings = readSettings(globals);

    if (!settings.auto_generate || !isConfigured(settings)) return;
    if (!media?.id || !isSupportedMedia(media)) return;

    const result = await generateMedia(settings, {
        mediaId: media.id,
        spaceId: globals.getSpaceId(),
        language: generationLanguage(globals),
        fields: GENERATED_FIELDS,
    });

    if (!result.ok) {
        console.error(
            pluginInfo.id,
            "auto generation",
            media.id,
            result.message,
        );
    }
};
