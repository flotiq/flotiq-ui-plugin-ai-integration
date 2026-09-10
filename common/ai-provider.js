const MODELS_TIMEOUT_MS = 15000;

export const normalizeBaseUrl = (value) =>
    (value || "").trim().replace(/\/+$/, "");

const OPERATION_SUFFIX = /\/(chat\/)?(completions?|responses?)\/?$/i;

export const modelsUrlFor = (aiUrl) =>
    `${normalizeBaseUrl(aiUrl).replace(OPERATION_SUFFIX, "")}/models`;

export const fetchModels = async (aiUrl, apiKey) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MODELS_TIMEOUT_MS);

    try {
        const response = await fetch(modelsUrlFor(aiUrl), {
            signal: controller.signal,
            headers: {
                Accept: "application/json",
                ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            },
        });

        let body = null;
        try {
            body = await response.json();
        } catch {
            body = null;
        }

        if (!response.ok) {
            return {
                ok: false,
                models: [],
                error: body?.error?.message || `HTTP ${response.status}`,
            };
        }

        const models = (body?.data || body?.models || [])
            .map((item) => (typeof item === "string" ? item : item.id || item.name))
            .filter(Boolean)
            .sort();

        if (!models.length) {
            return { ok: false, models: [], error: null };
        }

        return { ok: true, models, error: null };
    } catch (error) {
        return {
            ok: false,
            models: [],
            error:
                error.name === "AbortError"
                    ? "Request timed out"
                    : "Cannot reach the endpoint (network error or CORS)",
        };
    } finally {
        clearTimeout(timeout);
    }
};
