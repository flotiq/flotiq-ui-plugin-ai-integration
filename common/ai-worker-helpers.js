import i18n from "../i18n";

export const errorMessages = (payload, fallback) => {
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

export const classify = (httpStatus, payload) => {
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

export const toEntry = (log) => ({
    timestamp: log.finished_at || log.started_at,
    type: "connection_test",
    status: log.status === "success" ? "succeeded" : "failed",
    attempts: Number(log.attempts) || 1,
    durationMs: Number(log.duration_ms) || 0,
    message: log.errors || "",
});
