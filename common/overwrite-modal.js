import pluginInfo from "../plugin-manifest.json";
import i18n from "../i18n";
import checkmarkIcon from "inline:../images/checkmark-icon.svg";

const modalId = `${pluginInfo.id}-modal-overwrite`;

const OVERWRITE_FIELDS = [
    { name: "title", label: "Modal.FieldTitle" },
    { name: "alt", label: "Modal.FieldAlt" },
];

const checkboxMarkup = (name) => /* html */ `
    <span class="plugin-ai-integration-overwrite__checkbox">
      <input type="checkbox" name="${name}" checked />
      <span class="plugin-ai-integration-overwrite__checkmark">${checkmarkIcon}</span>
    </span>
  `;

const buildOverwriteOption = ({ name, label }, value) => {
    const option = document.createElement("label");
    option.className = "plugin-ai-integration-overwrite__option";

    option.innerHTML = /* html */ `
    ${checkboxMarkup(name)}
    <span class="plugin-ai-integration-overwrite__text">
      <span class="plugin-ai-integration-overwrite__label"></span>
      <span class="plugin-ai-integration-overwrite__value"></span>
    </span>
  `;

    const text = typeof value === "string" ? value.trim() : "";

    option.querySelector(
        ".plugin-ai-integration-overwrite__label",
    ).textContent = i18n.t(label);

    const valueElement = option.querySelector(
        ".plugin-ai-integration-overwrite__value",
    );
    valueElement.textContent = text || i18n.t("Modal.EmptyValue");
    valueElement.title = text;

    return option;
};

const buildOverwriteContent = (values) => {
    const wrapper = document.createElement("div");
    wrapper.className =
        "plugin-ai-integration-modal plugin-ai-integration-overwrite";

    wrapper.innerHTML = /* html */ `
    <p class="plugin-ai-integration-overwrite__title"></p>
    <p class="plugin-ai-integration-overwrite__note"></p>
    <div class="plugin-ai-integration-overwrite__options"></div>
  `;

    wrapper.querySelector(
        ".plugin-ai-integration-overwrite__title",
    ).textContent = i18n.t("Modal.OverwriteTitle");

    wrapper.querySelector(
        ".plugin-ai-integration-overwrite__note",
    ).textContent = i18n.t("Modal.OverwriteNote");

    const options = wrapper.querySelector(
        ".plugin-ai-integration-overwrite__options",
    );
    OVERWRITE_FIELDS.forEach((field) =>
        options.appendChild(buildOverwriteOption(field, values[field.name])),
    );

    return wrapper;
};

export const confirmOverwrite = async (openModal, values) => {
    const content = buildOverwriteContent(values);

    const confirmed = await openModal({
        id: modalId,
        size: "md",
        hideClose: true,
        className:
            "plugin-ai-integration-dialog plugin-ai-integration-dialog--centered",
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

    return fields;
};
