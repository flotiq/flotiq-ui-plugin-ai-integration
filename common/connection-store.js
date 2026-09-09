const state = {
    lastTest: null,
    banner: { type: "idle" },
    connection: null,
    savedBanner: { type: "idle" },
};

const subscribers = new Set();

const notify = () => subscribers.forEach((fn) => fn());

export const subscribe = (fn) => {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
};

export const getEntries = () => (state.lastTest ? [state.lastTest] : []);

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
    state.lastTest = { timestamp: new Date().toISOString(), ...entry };
    notify();
};

export const CONNECTION = {
    ACTIVE: "active",
    DISCONNECTED: "disconnected",
};

export const getConnection = () => state.connection;

export const markConnected = (at) => {
    state.connection = { status: CONNECTION.ACTIVE, at };
};

export const markDisconnected = () => {
    state.connection = { status: CONNECTION.DISCONNECTED };
    state.banner = { type: "idle" };
    notify();
};

export const hydrate = (settings) => {
    state.lastTest =
        settings?.lastTest || null;
    state.connection = settings?.connection || null;

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

export const restoreBanner = () => {
    state.banner = state.savedBanner;
    notify();
};


export const withState = (values) => {
    return { ...values, lastTest: state.lastTest, connection: state.connection };
};
