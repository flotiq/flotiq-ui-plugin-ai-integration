import { isSupportedMedia } from "../../common/lib/generation-rules";
import { isConfigured, parseSettings } from "../../common/lib/settings-parser";
import { startAutoGeneration } from "../../common/lib/generation";

export const handleMediaAfterUpload = ({ media }, globals) => {
    const settings = parseSettings(globals.getPluginSettings());

    if (!settings.auto_generate || !isConfigured(settings)) return;
    if (!media?.id || !isSupportedMedia(media)) return;

    startAutoGeneration(media, settings, globals);
};
