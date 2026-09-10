import { fetchModels, normalizeBaseUrl } from "./ai-provider";
import { isValidAiUrl } from "./validate-url";

/**
 * One in-memory entry per (url, key) pair, so switching values back and forth
 * inside one modal session does not re-hit the provider.
 */
const cache = new Map();

const keyFor = (aiUrl, apiKey) => `${normalizeBaseUrl(aiUrl)}|${apiKey || ""}`;

const EMPTY = { status: "idle", models: [], error: null };

export const getModelsState = (aiUrl, apiKey) => {
    if (!isValidAiUrl(aiUrl) || !apiKey) return EMPTY;
    return cache.get(keyFor(aiUrl, apiKey)) || EMPTY;
};

export const loadModels = async (aiUrl, apiKey) => {
    if (!isValidAiUrl(aiUrl) || !apiKey) return;

    const key = keyFor(aiUrl, apiKey);
    const current = cache.get(key);
    if (current?.status === "loading" || current?.status === "loaded") return;

    cache.set(key, { status: "loading", models: [], error: null });

    const { ok, models, error } = await fetchModels(aiUrl, apiKey);

    cache.set(key, { status: ok ? "loaded" : "error", models, error });
};
