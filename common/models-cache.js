import { fetchModels, normalizeBaseUrl } from "./ai-provider";
import { isValidAiUrl } from "./validate-url";

/**
 * One in-memory entry per (url, key) pair, so switching values back and forth
 * inside one modal session does not re-hit the provider.
 */
const cache = new Map();
const subscribers = new Set();

const keyFor = (aiUrl, apiKey) => `${normalizeBaseUrl(aiUrl)}|${apiKey || ""}`;

const notify = () => subscribers.forEach((fn) => fn());

export const subscribeToModels = (fn) => {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
};

export const getModelsState = (aiUrl, apiKey) => {
    if (!isValidAiUrl(aiUrl) || !apiKey) {
        return { status: "idle", models: [], error: null };
    }
    return (
        cache.get(keyFor(aiUrl, apiKey)) || {
            status: "idle",
            models: [],
            error: null,
        }
    );
};

export const loadModels = async (aiUrl, apiKey) => {
    if (!isValidAiUrl(aiUrl) || !apiKey) return;

    const key = keyFor(aiUrl, apiKey);
    const current = cache.get(key);
    if (current?.status === "loading" || current?.status === "loaded") return;

    cache.set(key, { status: "loading", models: [], error: null });
    notify();

    const { ok, models, error } = await fetchModels(aiUrl, apiKey);

    cache.set(key, { status: ok ? "loaded" : "error", models, error });
    notify();
};

/**
 * Called when the user edits the URL or the key. The cache is keyed by the
 * pair, so nothing needs clearing - this only repaints the status line while
 * the user types.
 */
export const invalidateModels = () => notify();
