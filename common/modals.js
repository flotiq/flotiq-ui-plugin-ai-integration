import pluginInfo from "../plugin-manifest.json";
import i18n from "../i18n";
import checkmarkIcon from "inline:../images/checkmark-icon.svg";
import warningTriangleIcon from "inline:../images/warning-triangle-icon.svg";

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

const OVERWRITE_FIELDS = [
    { name: "title", label: "Modal.FieldTitle" },
    { name: "alt", label: "Modal.FieldAlt" },
];

const SKIP_STORAGE_KEY = `${pluginInfo.id}-skip-overwrite-modal`;

const isModalSkipped = () => {
    try {
        return sessionStorage.getItem(SKIP_STORAGE_KEY) === "true";
    } catch {
        return false;
    }
};

const skipModal = () => {
    try {
        sessionStorage.setItem(SKIP_STORAGE_KEY, "true");
    } catch {
        // Storage unavailable - the modal is simply shown again next time.
    }
};

const checkboxMarkup = (name, checked) => /* html */ `
    <span class="plugin-ai-integration-overwrite__checkbox">
      <input type="checkbox" name="${name}" ${checked ? "checked" : ""} />
      <span class="plugin-ai-integration-overwrite__checkmark">${checkmarkIcon}</span>
    </span>
  `;

const buildOverwriteOption = ({ name, label }, value) => {
    const option = document.createElement("label");
    option.className = "plugin-ai-integration-overwrite__option";

    option.innerHTML = /* html */ `
    ${checkboxMarkup(name, true)}
    <span class="plugin-ai-integration-overwrite__text">
      <span class="plugin-ai-integration-overwrite__label"></span>
      <span class="plugin-ai-integration-overwrite__value"></span>
    </span>
  `;

    const text = typeof value === "string" ? value.trim() : "";

    option.querySelector(".plugin-ai-integration-overwrite__label").textContent =
        i18n.t(label);

    const valueElement = option.querySelector(
        ".plugin-ai-integration-overwrite__value",
    );
    valueElement.textContent = text || i18n.t("Modal.EmptyValue");
    valueElement.title = text;

    return option;
};

const buildOverwriteContent = (values) => {
    const wrapper = document.createElement("div");
    wrapper.className = "plugin-ai-integration-modal plugin-ai-integration-overwrite";

    wrapper.innerHTML = /* html */ `
    <p class="plugin-ai-integration-overwrite__title"></p>
    <p class="plugin-ai-integration-overwrite__note"></p>
    <div class="plugin-ai-integration-overwrite__options"></div>
    <label class="plugin-ai-integration-overwrite__skip">
      ${checkboxMarkup("skip", false)}
      <span class="plugin-ai-integration-overwrite__skip-text"></span>
    </label>
  `;

    wrapper.querySelector(
        ".plugin-ai-integration-overwrite__skip-text",
    ).textContent = i18n.t("Modal.SkipInSession");

    wrapper.querySelector(".plugin-ai-integration-overwrite__title").textContent =
        i18n.t("Modal.OverwriteTitle");

    wrapper.querySelector(".plugin-ai-integration-overwrite__note").textContent =
        i18n.t("Modal.OverwriteNote");

    const options = wrapper.querySelector(
        ".plugin-ai-integration-overwrite__options",
    );
    OVERWRITE_FIELDS.forEach((field) =>
        options.appendChild(buildOverwriteOption(field, values[field.name])),
    );

    return wrapper;
};

export const confirmOverwrite = async (openModal, values) => {
    if (isModalSkipped()) return OVERWRITE_FIELDS.map(({ name }) => name);

    const content = buildOverwriteContent(values);

    const confirmed = await openModal({
        id: `${modalId}-overwrite`,
        size: "md",
        hideClose: true,
        className: "plugin-ai-integration-dialog plugin-ai-integration-dialog--centered",
        content,
        buttons: [
            {
                key: "cancel",
                label: i18n.t("Modal.Cancel"),
                color: "blueBordered",
                result: false,
            },
            {
                key: "overwrite",
                label: i18n.t("Modal.Overwrite"),
                color: "blue",
                result: true,
            },
        ],
    });

    if (!confirmed) return null;

    const fields = [
        ...content.querySelectorAll(
            ".plugin-ai-integration-overwrite__options input:checked",
        ),
    ].map((input) => input.name);

    if (content.querySelector('input[name="skip"]').checked) skipModal();

    return fields;
};
