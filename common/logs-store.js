const MAX_ENTRIES = 20;

/**
 * Logs live inside the same `_plugin_settings` JSON as the configuration.
 * That keeps the manifest permissions minimal (no extra CTD, no canCreate),
 * at the cost of the log being capped and rewritten on every save.
 * Move to a dedicated CTD if the history needs to be searchable or unbounded.
 */
const state = {
    entries: [],
    banner: { type: "idle" },
};

const subscribers = new Set();

const notify = () => subscribers.forEach((fn) => fn());

export const subscribe = (fn) => {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
};

export const getEntries = () => state.entries;

export const getBanner = () => state.banner;

/** Banner variants: idle | loading | active | failed */
export const setBanner = (banner) => {
    state.banner = banner;
    notify();
};

/**
 * @param {object} entry
 * @param {"connection_test"|"auto_generate"|"manual_generation"} entry.type
 * @param {"succeeded"|"failed"} entry.status
 * @param {number} entry.attempts
 * @param {number} entry.durationMs
 * @param {string} [entry.message]
 */
export const addEntry = (entry) => {
    state.entries = [
        { timestamp: new Date().toISOString(), ...entry },
        ...state.entries,
    ].slice(0, MAX_ENTRIES);
    notify();
};

/** Called when the manage modal opens, with the persisted settings object. */
export const hydrate = (settings) => {
    state.entries = Array.isArray(settings?.logs) ? settings.logs : [];

    const lastTest = state.entries.find(
        (entry) => entry.type === "connection_test",
    );

    if (!lastTest) {
        state.banner = { type: "idle" };
    } else if (lastTest.status === "succeeded") {
        state.banner = {
            type: "active",
            url: settings.ai_url,
            model: settings.model,
            at: lastTest.timestamp,
        };
    } else {
        state.banner = { type: "failed", message: lastTest.message };
    }

    notify();
};

/** Logs are persisted alongside the settings - merge them in before saving. */
export const withLogs = (values) => ({ ...values, logs: state.entries });
