/**
 * The model listing goes straight from the browser to the provider, not through
 * the worker: OpenAI serves /models with `access-control-allow-origin: *` and
 * allows the Authorization header, so a plain fetch works and needs no proxy.
 * Providers that do not (or that have no listing at all) leave the model select
 * empty - see plugins/manage/field-config.js.
 */

const MODELS_TIMEOUT_MS = 15000;

export const normalizeBaseUrl = (value) =>
    (value || "").trim().replace(/\/+$/, "");

/**
 * `ai_url` is the full completions endpoint, because the worker POSTs to it
 * verbatim. The listing lives next to the API root rather than next to the
 * endpoint, so drop the trailing operation segment:
 *
 *   .../v1/chat/completions -> .../v1/models
 *   .../v1/completions      -> .../v1/models
 *
 * Anything that is not a recognised operation is left alone, which yields a URL
 * the provider will reject - deliberately, because guessing harder would send
 * requests to paths nobody asked for. A provider whose listing cannot be derived
 * simply leaves the model select empty.
 */
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

        // A 2xx that lists nothing is not a usable list - treat it as a failure
        // so the field degrades to free text instead of offering an empty select.
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
