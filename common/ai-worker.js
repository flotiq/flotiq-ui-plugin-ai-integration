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

const REASON = {
    ENDPOINT: "endpoint",
    API_KEY: "api_key",
    MODEL: "model",
    FLOTIQ_KEY: "flotiq_key",
    UNKNOWN: "unknown",
};

const mentionsModel = (body) => /model/i.test(body || "");

const classify = (httpStatus, payload) => {
    if (httpStatus === 401) return REASON.FLOTIQ_KEY;

    const providerStatus = payload?.providerStatus;
    const providerBody = payload?.providerBody;

    if (providerStatus === 401 || providerStatus === 403) return REASON.API_KEY;

    if (providerStatus === 404)
        return mentionsModel(providerBody) ? REASON.MODEL : REASON.ENDPOINT;

    if (providerStatus === 400 && mentionsModel(providerBody)) return REASON.MODEL;

    return REASON.UNKNOWN;
};

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

        if (!payload?.title || !payload?.alt) {
            return {
                type: TEST_RESULT.WARNING,
                messages: [i18n.t("Test.EmptyResponse")],
                response: JSON.stringify(payload),
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
