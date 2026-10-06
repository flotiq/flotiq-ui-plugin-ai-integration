import { isSupportedMedia } from "../../common/media-generation";
import { isConfigured, parseSettings } from "../../common/settings-parser";
import { trackAutoGeneration } from "../media-form-add/lib/generation";

export const handleMediaAfterUpload = ({ media }, globals) => {
    const settings = parseSettings(globals.getPluginSettings());

    if (!settings.auto_generate || !isConfigured(settings)) return;
    if (!media?.id || !isSupportedMedia(media)) return;

    trackAutoGeneration(media, settings, globals);
};
