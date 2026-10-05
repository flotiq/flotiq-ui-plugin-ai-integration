import pluginInfo from "../../plugin-manifest.json";
import { generateMedia } from "../../common/ai-worker";
import {
    GENERATED_FIELDS,
    generationLanguage,
    isSupportedMedia,
} from "../../common/media-generation";
import { isConfigured, parseSettings } from "../../common/settings-parser";

export const handleMediaAfterUpload = async ({ media }, globals) => {
    const settings = parseSettings(globals.getPluginSettings());

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
