import i18n from "../../../i18n";
import spinnerIcon from "inline:../../../images/spinner-icon.svg";
import starIcon from "inline:../../../images/star-icon.svg";
import {
    isGenerating,
    isSupportedMedia,
} from "../../../common/media-generation";
import { applyLock } from "../lib/generation";

export const createGenerateButton = () => {
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

    const button = {
        element,
        ctx: {},
        starting: false,
        checking: false,
        locked: false,
    };

    button.render = () => {
        const media = button.ctx.contentObject;
        const generating = isGenerating(media.id) || button.starting;
        const supported = isSupportedMedia(media);

        element.querySelector(
            ".plugin-ai-integration-media__label",
        ).textContent = i18n.t("Media.Label");

        const tip = element.querySelector(".plugin-ai-integration-media__tip");
        if (supported) delete tip.dataset.tooltip;
        else tip.dataset.tooltip = i18n.t("Media.UnsupportedFormat");

        const buttonElement = element.querySelector(
            ".plugin-ai-integration-media__button",
        );
        buttonElement.disabled =
            generating ||
            button.checking ||
            !!button.ctx.disabled ||
            !supported;
        buttonElement.dataset.loading = String(generating);

        element.querySelector(".plugin-ai-integration-media__icon").innerHTML =
            generating ? spinnerIcon : starIcon;

        element.querySelector(
            ".plugin-ai-integration-media__text",
        ).textContent = i18n.t(
            generating ? "Media.Generating" : "Media.Generate",
        );

        applyLock(button, generating);
    };

    return button;
};
