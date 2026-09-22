import pluginInfo from "../plugin-manifest.json";
import i18n from "../i18n";
import { warningTriangleIcon } from "./icons";

const modalId = `${pluginInfo.id}-modal`;

const buildContent = (modelResponse) => {
    const wrapper = document.createElement("div");
    wrapper.className = "plugin-ai-integration-modal";

    wrapper.innerHTML = /* html */ `
    <div class="plugin-ai-integration-modal__heading">
      <span class="plugin-ai-integration-modal__heading-icon">${warningTriangleIcon}</span>
      <span class="plugin-ai-integration-modal__heading-text"></span>
    </div>
    <p class="plugin-ai-integration-modal__note"></p>
    <label class="plugin-ai-integration-modal__label"
           for="plugin-ai-integration-model-response"></label>
    <input class="plugin-ai-integration-modal__response"
           id="plugin-ai-integration-model-response" type="text" readonly />
  `;

    wrapper.querySelector(".plugin-ai-integration-modal__heading-text").textContent =
        i18n.t("Modal.WarningTitle");

    wrapper.querySelector(".plugin-ai-integration-modal__note").textContent =
        i18n.t("Modal.WarningNote");

    wrapper.querySelector(".plugin-ai-integration-modal__label").textContent =
        i18n.t("Modal.ModelResponse");

    const field = wrapper.querySelector(
        ".plugin-ai-integration-modal__response",
    );

    field.setAttribute("value", modelResponse || "");
    field.value = modelResponse || "";

    return wrapper;
};

export const confirmWarnings = (openModal, modelResponse) =>
    openModal({
        id: modalId,
        size: "md",
        hideClose: true,
        className: "plugin-ai-integration-dialog",
        content: buildContent(modelResponse),
        buttons: [
            {
                key: "another-model",
                label: i18n.t("Modal.ChooseAnotherModel"),
                color: "blueBordered",
                result: false,
            },
            {
                key: "accept",
                label: i18n.t("Modal.Accept"),
                color: "blue",
                result: true,
            },
        ],
    });
