const state = {
    entries: [],
    loadingEntries: false,
    entriesError: false,
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

export const getEntries = () => state.entries;

export const isLoadingEntries = () => state.loadingEntries;

export const hasEntriesError = () => state.entriesError;

export const setLoadingEntries = (loading) => {
    state.loadingEntries = loading;
    notify();
};

export const setEntries = (entries) => {
    state.entries = entries;
    state.loadingEntries = false;
    state.entriesError = false;
    notify();
};

export const setEntriesError = () => {
    state.entriesError = true;
    state.loadingEntries = false;
    notify();
};

export const getBanner = () => state.banner;

/** Banner variants: idle | loading | active | failed */
export const setBanner = (banner) => {
    state.banner = banner;
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
    return { ...values, connection: state.connection };
};
