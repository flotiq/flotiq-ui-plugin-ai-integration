import pluginInfo from "../plugin-manifest.json";
import i18n from "../i18n";

// Injected by esbuild - falls back to production, dev overrides it with
// WORKER_URL=http://localhost:8787 (see esbuild.config.js).
const WORKER_URL = process.env.WORKER_URL;

// The worker calls the AI model synchronously on /test and does not retry,
// so allow generous headroom before giving up.
const TIMEOUT_MS = 300000;

/**
 * Every worker call is authenticated against Flotiq's /api/auth-context using
 * the read-only key the user pastes into the settings form. The key is only
 * proof of access to the space - the worker writes logs and media with its own
 * credentials.
 */
const workerFetch = async (
    path,
    { token, spaceId, method = "GET", body } = {},
) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(`${WORKER_URL}${path}`, {
            method,
            signal: controller.signal,
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "X-AUTH-TOKEN": token,
                "X-SPACE-ID": spaceId,
            },
            ...(body ? { body: JSON.stringify(body) } : {}),
        });

        let payload = null;
        try {
            payload = await response.json();
        } catch {
            payload = null;
        }

        return { response, payload };
    } finally {
        clearTimeout(timeout);
    }
};

export const TEST_RESULT = {
    SUCCESS: "success",
    WARNING: "warning",
    BLOCKING: "blocking",
};

/**
 * The worker answers with three different error shapes, and itty-router spreads
 * the body onto `{ status }` rather than nesting it:
 *
 *   auth middleware        -> { error: "Unauthenticated" }
 *   thrown StatusError     -> { status: 500, error: "..." }
 *   zod validation (400)   -> { status: 400, ai_url: ["..."], space_id: [...] }
 *
 * Flatten all three to plain strings, so a validation failure never reaches the
 * form as "[object Object]".
 */
const errorMessages = (payload, fallback) => {
    if (!payload || typeof payload !== "object") return [fallback];

    if (typeof payload.error === "string") return [payload.error];
    if (typeof payload.message === "string") return [payload.message];

    const messages = Object.entries(payload)
        .filter(([key]) => key !== "status")
        .flatMap(([field, value]) =>
            (Array.isArray(value) ? value : [value])
                .filter((entry) => typeof entry === "string")
                .map((entry) => `${field}: ${entry}`),
        );

    return messages.length ? messages : [fallback];
};

/**
 * Turn a failed /test into something a person can act on.
 *
 * The provider's own words never reach the UI - they leak keys ("Incorrect API
 * key provided: sk-u29B..."), they are English-only, and they are shaped by
 * whichever vendor happens to be configured. `reason` names the field at fault
 * so the form can pin a hint to it, and the raw text goes to the console.
 *
 * A provider 404 is ambiguous: a wrong URL and an unknown model both produce
 * one, and only the body separates them.
 */
const REASON = {
    ENDPOINT: "endpoint",
    API_KEY: "api_key",
    MODEL: "model",
    FLOTIQ_KEY: "flotiq_key",
    UNKNOWN: "unknown",
};

const mentionsModel = (body) => /model/i.test(body || "");

const classify = (httpStatus, payload) => {
    // The worker's own auth gate fired - this is about the Flotiq key, and it
    // never reached the provider.
    if (httpStatus === 401) return REASON.FLOTIQ_KEY;

    const providerStatus = payload?.providerStatus;
    const providerBody = payload?.providerBody;

    if (providerStatus === 401 || providerStatus === 403) return REASON.API_KEY;

    if (providerStatus === 404)
        return mentionsModel(providerBody) ? REASON.MODEL : REASON.ENDPOINT;

    if (providerStatus === 400 && mentionsModel(providerBody)) return REASON.MODEL;

    return REASON.UNKNOWN;
};

/** Whole-banner text. */
export const bannerMessageFor = (reason, fallback) => {
    switch (reason) {
        case REASON.FLOTIQ_KEY:
            return i18n.t("Error.FlotiqUnauthorized");
        case REASON.API_KEY:
            return i18n.t("Error.Unauthorized");
        case REASON.ENDPOINT:
            return i18n.t("Error.NotFound");
        default:
            return fallback;
    }
};

/** Which input the hint belongs under, and what it says. */
export const fieldErrorFor = (reason) => {
    switch (reason) {
        case REASON.FLOTIQ_KEY:
            return ["flotiq_api_key", i18n.t("Validation.FlotiqKeyRejected")];
        case REASON.API_KEY:
            return ["api_key", i18n.t("Validation.ApiKeyRejected")];
        case REASON.MODEL:
            return ["model", i18n.t("Validation.ModelRejected")];
        default:
            return ["ai_url", i18n.t("Validation.EndpointRejected")];
    }
};

/**
 * POST /test - the worker runs one synchronous generation against a built-in
 * test image and returns the parsed model output. It performs no retries, so a
 * temporarily unavailable model surfaces here as a blocking error.
 */
export const testConfiguration = async (values, spaceId) => {
    const startedAt = Date.now();
    const attempts = 1;

    try {
        const { response, payload } = await workerFetch("/test", {
            token: values.flotiq_api_key,
            spaceId,
            method: "POST",
            body: {
                ai_url: values.ai_url,
                ai_key: values.api_key,
                model_name: values.model,
                space_id: spaceId,
            },
        });

        const durationMs = Date.now() - startedAt;

        if (!response.ok) {
            const raw = errorMessages(payload, `HTTP ${response.status}`);
            const reason = classify(response.status, payload);

            // Keep the provider's wording where a developer can find it, out of
            // the UI where it would be noise at best and a leaked key at worst.
            console.error(pluginInfo.id, "connection test failed", raw.join(" "));

            return {
                type: TEST_RESULT.BLOCKING,
                messages: [
                    bannerMessageFor(reason, i18n.t("Test.Unreachable")),
                ],
                reason,
                durationMs,
                attempts,
                httpStatus: response.status,
            };
        }

        // A 2xx without usable metadata means the model answered but could not
        // produce what we asked for - worth saving, worth warning about.
        if (!payload?.title || !payload?.alt) {
            return {
                type: TEST_RESULT.WARNING,
                messages: [i18n.t("Test.EmptyResponse")],
                durationMs,
                attempts,
            };
        }

        return { type: TEST_RESULT.SUCCESS, messages: [], durationMs, attempts };
    } catch (error) {
        return {
            type: TEST_RESULT.BLOCKING,
            messages: [
                error.name === "AbortError"
                    ? i18n.t("Test.TimedOut")
                    : i18n.t("Test.Unreachable"),
            ],
            durationMs: Date.now() - startedAt,
            attempts,
        };
    }
};

/**
 * GET /logs/:spaceId/:mediaId
 *
 * Both segments are required by the worker's router, so there is no way to list
 * a whole space yet. Unused by the Logs tab for now - connection tests are kept
 * in the plugin settings instead, because /test writes no log entry.
 */
export const fetchLogs = async (
    { token, spaceId, mediaId },
    { page, limit } = {},
) => {
    const params = new URLSearchParams();
    if (page) params.set("page", page);
    if (limit) params.set("limit", limit);

    const query = params.toString() ? `?${params}` : "";

    const { response, payload } = await workerFetch(
        `/logs/${spaceId}/${mediaId}${query}`,
        { token, spaceId },
    );

    if (!response.ok) return { ok: false, entries: [] };

    return { ok: true, entries: payload?.data || [] };
};
