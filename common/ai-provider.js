/**
 * All calls go to the provider configured by the user, not to Flotiq API,
 * so plain fetch is fine here (apiClient is only mandatory for Flotiq API).
 */

const MODELS_TIMEOUT_MS = 15000;
const TEST_TIMEOUT_MS = 300000; // the UI promises "up to 5 minutes"

const request = async (url, apiKey, init = {}, timeoutMs) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...init,
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
                ...(init.headers || {}),
            },
        });

        let body = null;
        try {
            body = await response.json();
        } catch {
            body = null;
        }

        return { response, body };
    } finally {
        clearTimeout(timeout);
    }
};

export const normalizeBaseUrl = (value) =>
    (value || "").trim().replace(/\/+$/, "");

/**
 * GET {ai_url}/models - OpenAI-compatible listing.
 * The user provides the full base URL including the version segment
 * (e.g. https://api.openai.com/v1), so no version is appended here.
 */
export const fetchModels = async (aiUrl, apiKey) => {
    try {
        const { response, body } = await request(
            `${normalizeBaseUrl(aiUrl)}/models`,
            apiKey,
            {},
            MODELS_TIMEOUT_MS,
        );

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
    }
};

export const TEST_RESULT = {
    SUCCESS: "success",
    WARNING: "warning",
    BLOCKING: "blocking",
};

/**
 * POST {ai_url}/test
 *
 * Result contract (confirm with the API owner before shipping):
 *   non-2xx / network failure         -> blocking
 *   2xx + body.status === "error"     -> blocking
 *   2xx + body.status === "warning"   -> warning  (body.messages: string[])
 *   2xx + anything else               -> success
 *
 * Returns { type, messages, durationMs, attempts }. Retries are not implemented,
 * so `attempts` is always 1 - add a retry loop here if the API needs one.
 */
export const testConfiguration = async ({ ai_url, api_key, model }) => {
    const startedAt = Date.now();
    const attempts = 1;

    try {
        const { response, body } = await request(
            `${normalizeBaseUrl(ai_url)}/test`,
            api_key,
            { method: "POST", body: JSON.stringify({ model }) },
            TEST_TIMEOUT_MS,
        );

        const durationMs = Date.now() - startedAt;
        const messages = body?.messages || (body?.message ? [body.message] : []);

        if (!response.ok) {
            return {
                type: TEST_RESULT.BLOCKING,
                messages: messages.length
                    ? messages
                    : [`Configuration test failed (HTTP ${response.status})`],
                durationMs,
                attempts,
                httpStatus: response.status,
            };
        }

        if (body?.status === "error") {
            return {
                type: TEST_RESULT.BLOCKING,
                messages: messages.length ? messages : ["Configuration test failed"],
                durationMs,
                attempts,
            };
        }

        if (body?.status === "warning") {
            return {
                type: TEST_RESULT.WARNING,
                messages: messages.length
                    ? messages
                    : ["The provider reported a non-blocking problem"],
                durationMs,
                attempts,
            };
        }

        return { type: TEST_RESULT.SUCCESS, messages, durationMs, attempts };
    } catch (error) {
        return {
            type: TEST_RESULT.BLOCKING,
            messages: [
                error.name === "AbortError"
                    ? "Configuration test timed out"
                    : "Cannot reach the endpoint (network error or CORS)",
            ],
            durationMs: Date.now() - startedAt,
            attempts,
        };
    }
};
