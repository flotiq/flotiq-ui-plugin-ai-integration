import { fetchModels } from "./ai-worker";

const cache = new Map();

const EMPTY = { status: "idle", models: [] };

const keyFor = (aiUrl, apiKey) => `${aiUrl || ""}|${apiKey || ""}`;

export const getModels = (aiUrl, apiKey) =>
    cache.get(keyFor(aiUrl, apiKey)) || EMPTY;

export const loadModels = async (values, spaceId) => {
    const { ai_url: aiUrl, api_key: apiKey, flotiq_api_key: flotiqKey } = values;

    if (!aiUrl || !apiKey || !flotiqKey || !spaceId) return false;

    const key = keyFor(aiUrl, apiKey);
    const current = cache.get(key);

    if (current?.status === "loading" || current?.status === "loaded") {
        return false;
    }

    cache.set(key, { status: "loading", models: [] });

    const { ok, models } = await fetchModels(values, spaceId);

    cache.set(key, { status: ok ? "loaded" : "error", models });

    return true;
};
