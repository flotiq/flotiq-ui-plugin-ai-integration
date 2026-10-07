import pluginInfo from "../plugin-manifest.json";
import cssString from "inline:./styles/style.css";
import i18n from "../i18n";
import { registerFn } from "../common/lib/plugin-element-cache";
import { setWorkerUrlFromApi } from "../common/api/ai-worker";
import { isOwnSettingsForm } from "../common/lib/settings-form";
import "../common/elements/tooltip";
import { handleManageSchema } from "./manage";
import { getHeader } from "./form-add";
import { handleFormFieldConfig } from "./field-config";
import { handleFormFieldListeners } from "./field-listeners";
import { handleMediaFormAdd } from "./media-form-add";
import { handleMediaAfterUpload } from "./media-after-upload";
import { handleSidebarPanel } from "./sidebar-panel";

const loadStyles = () => {
    let style = document.getElementById(`${pluginInfo.id}-styles`);

    if (!style) {
        style = document.createElement("style");
        style.id = `${pluginInfo.id}-styles`;
        document.head.appendChild(style);
    }

    style.textContent = cssString;

    const fontId = `${pluginInfo.id}-font`;
    if (!document.getElementById(fontId)) {
        const font = document.createElement("link");
        font.id = fontId;
        font.rel = "stylesheet";
        font.href =
            "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400&display=swap";
        document.head.appendChild(font);
    }
};

registerFn(pluginInfo, (handler, client, globals) => {
    loadStyles();

    setWorkerUrlFromApi(globals.getApiUrl());

    const language = globals.getLanguage();
    if (language !== i18n.language) i18n.changeLanguage(language);

    handler.on("flotiq.language::changed", ({ language }) => {
        if (language !== i18n.language) i18n.changeLanguage(language);
    });

    handler.on("flotiq.plugins.manage::form-schema", (data) =>
        handleManageSchema(data, client, globals),
    );

    handler.on("flotiq.form::add", ({ contentType }) =>
        isOwnSettingsForm(contentType) ? getHeader(globals) : null,
    );

    handler.on("flotiq.form.field::config", (data) =>
        handleFormFieldConfig(data),
    );

    handler.on("flotiq.form.field.listeners::add", (data) =>
        handleFormFieldListeners(data, globals),
    );

    handler.on("flotiq.media.form::add", (data) =>
        handleMediaFormAdd(data, globals),
    );

    handler.on("flotiq.media::after-upload", (data) => {
        handleMediaAfterUpload(data, globals);
    });

    handler.on("flotiq.form.sidebar-panel::add", (data) =>
        handleSidebarPanel(data, globals),
    );
});
