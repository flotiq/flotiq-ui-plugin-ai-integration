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

    // The element may be attached/detached many times - wait before dropping it.
    element.addEventListener("flotiq.detached", () => {
        detachTimeoutId = setTimeout(() => {
            removeElement(key);
            onRemove?.();
        }, 50);
    });
};

export const getCachedElement = (key) => elements[key];

/**
 * FlotiqPlugins may not exist yet when the bundle is evaluated
 * (e.g. when the plugin is loaded from a manifest before the app boots).
 */
export const registerFn = (pluginInfo, callback) => {
    if (window.FlotiqPlugins?.add) {
        window.FlotiqPlugins.add(pluginInfo, callback);
        return;
    }
    if (!window.initFlotiqPlugins) window.initFlotiqPlugins = [];
    window.initFlotiqPlugins.push({ pluginInfo, callback });
};
