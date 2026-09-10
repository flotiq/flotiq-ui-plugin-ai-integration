const elements = {};

export const removeElement = (key) => {
    delete elements[key];
};

export const addElementToCache = (element, key, data = {}, onRemove = null) => {
    elements[key] = { element, data };

    if (!element?.addEventListener) return;

    let detachTimeoutId;

    element.addEventListener("flotiq.attached", () => {
        if (detachTimeoutId) {
            clearTimeout(detachTimeoutId);
            detachTimeoutId = null;
        }
    });

    element.addEventListener("flotiq.detached", () => {
        detachTimeoutId = setTimeout(() => {
            removeElement(key);
            onRemove?.();
        }, 50);
    });
};

export const getCachedElement = (key) => elements[key];

export const registerFn = (pluginInfo, callback) => {
    if (window.FlotiqPlugins?.add) {
        window.FlotiqPlugins.add(pluginInfo, callback);
        return;
    }
    if (!window.initFlotiqPlugins) window.initFlotiqPlugins = [];
    window.initFlotiqPlugins.push({ pluginInfo, callback });
};
