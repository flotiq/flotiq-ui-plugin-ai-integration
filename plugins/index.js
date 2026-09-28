import pluginInfo from "../plugin-manifest.json";
import cssString from "inline:./styles/style.css";
import i18n from "../i18n";
import { registerFn } from "../common/plugin-element-cache";
import { setWorkerUrlFromApi } from "../common/ai-worker";
import "../common/tooltip";
import { handleManageSchema } from "./manage";
import { getHeader } from "./form-add";
import { handleFormFieldConfig } from "./field-config";
import { handleFormFieldListeners } from "./field-listeners";

const loadStyles = () => {
    let style = document.getElementById(`${pluginInfo.id}-styles`);

    if (!style) {
        style = document.createElement("style");
        style.id = `${pluginInfo.id}-styles`;
        document.head.appendChild(style);
    }

    style.textContent = cssString;
};

const isOwnSettingsForm = (contentType) =>
    contentType?.id === pluginInfo.id && contentType?.nonCtdSchema;

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
        isOwnSettingsForm(contentType) ? getHeader() : null,
    );

    handler.on("flotiq.form.field::config", (data) =>
        handleFormFieldConfig(data),
    );

    handler.on("flotiq.form.field.listeners::add", (data) =>
        handleFormFieldListeners(data, globals),
    );
});
