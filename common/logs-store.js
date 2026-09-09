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
    /**
     * Whether the saved configuration is live, persisted next to it as
     * `connection: { status, at }`.
     *
     * This used to be inferred from the newest log entry, which conflated two
     * different things: "the last attempt failed" and "the integration is off".
     * A failed test does not un-save a working configuration, so the two need
     * separate storage.
     */
    connection: null,
    /** The banner as the modal opened, for an abandoned save to fall back to. */
    savedBanner: { type: "idle" },
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

export const CONNECTION = {
    ACTIVE: "active",
    DISCONNECTED: "disconnected",
};

export const getConnection = () => state.connection;

/** Settings only ever save after a passing test, so this marks that moment. */
export const markConnected = (at) => {
    state.connection = { status: CONNECTION.ACTIVE, at };
};

export const markDisconnected = () => {
    state.connection = { status: CONNECTION.DISCONNECTED };
    state.banner = { type: "idle" };
    notify();
};

/** Called when the manage modal opens, with the persisted settings object. */
export const hydrate = (settings) => {
    state.entries = Array.isArray(settings?.logs) ? settings.logs : [];
    state.connection = settings?.connection || null;

    // Reflects what is stored, not how the last attempt went - a failed test is
    // reported in the Logs tab and in the banner for that session only.
    state.banner =
        state.connection?.status === CONNECTION.ACTIVE
            ? {
                type: "active",
                url: settings.ai_url,
                model: settings.model,
                at: state.connection.at,
            }
            : { type: "idle" };

    state.savedBanner = state.banner;

    notify();
};

/**
 * Back to the state the modal opened with. Used when the user declines the
 * warning: nothing was saved, so the banner must not keep the "loading" it was
 * put into, nor claim an active connection that was never written.
 */
export const restoreBanner = () => {
    state.banner = state.savedBanner;
    notify();
};

/**
 * The log and the connection state ride along in the same settings JSON, so
 * merge both in before saving.
 */
export const withState = (values) => ({
    ...values,
    logs: state.entries,
    connection: state.connection,
});
