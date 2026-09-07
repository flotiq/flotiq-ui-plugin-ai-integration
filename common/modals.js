import pluginInfo from "../plugin-manifest.json";
import i18n from "../i18n";

const modalId = `${pluginInfo.id}-modal`;

const buildContent = (heading, messages, footer) => {
    const wrapper = document.createElement("div");
    wrapper.className = "plugin-ai-integration-modal";

    const title = document.createElement("h3");
    title.className = "plugin-ai-integration-modal__heading";
    title.textContent = heading;
    wrapper.appendChild(title);

    if (messages?.length) {
        const list = document.createElement("ul");
        list.className = "plugin-ai-integration-modal__list";
        messages.forEach((message) => {
            const item = document.createElement("li");
            item.textContent = message;
            list.appendChild(item);
        });
        wrapper.appendChild(list);
    }

    if (footer) {
        const note = document.createElement("p");
        note.className = "plugin-ai-integration-modal__note";
        note.textContent = footer;
        wrapper.appendChild(note);
    }

    return wrapper;
};

/**
 * Warning path - the user decides whether the configuration is saved.
 * Resolves to true (save anyway) or false (go back to the form).
 */
export const confirmWarnings = (openModal, messages) =>
    openModal({
        id: modalId,
        size: "lg",
        hideClose: true,
        content: buildContent(
            i18n.t("Modal.WarningTitle"),
            messages,
            i18n.t("Modal.WarningNote"),
        ),
        buttons: [
            {
                key: "save",
                label: i18n.t("Modal.SaveAnyway"),
                color: "blue",
                result: true,
            },
            {
                key: "cancel",
                label: i18n.t("Modal.BackToSettings"),
                color: "blueBordered",
                result: false,
            },
        ],
    });
