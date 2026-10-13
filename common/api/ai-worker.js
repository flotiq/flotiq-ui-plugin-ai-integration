import pluginInfo from "../../plugin-manifest.json";
import i18n from "../../i18n";
import { bannerMessageFor, classify, errorMessages } from "./worker-errors";
import { toGenerationEntries, toSpaceEntries } from "../lib/log-entries";

const PRODUCTION_WORKER_URL = "https://ai-image-worker.flotiq.com";
const WORKER_URL = process.env.WORKER_URL;

let workerUrl = WORKER_URL;

const WORKER_BY_API_HOST = [
    [/(^|\.)api\.flotiq\.com$/i, PRODUCTION_WORKER_URL],
    [/\.cdwv\.pl$/i, "https://ai-image-worker.staging.flotiq.com"],
];

export const setWorkerUrlFromApi = (apiUrl) => {
    if (WORKER_URL !== PRODUCTION_WORKER_URL) return workerUrl;

    try {
        const { host } = new URL(apiUrl);
        const match = WORKER_BY_API_HOST.find(([pattern]) =>
            pattern.test(host),
        );

        if (match) workerUrl = match[1];
    } catch {
        // Unparseable api url - keep the baked default.
    }

    return workerUrl;
};

const TIMEOUT_MS = 300000;

const TEST_JOB_ID = "test";

export const TEST_RESULT = {
    SUCCESS: "success",
    WARNING: "warning",
    BLOCKING: "blocking",
};

const workerFetch = async (
    path,
    { token, spaceId, method = "GET", body } = {},
) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(`${workerUrl}${path}`, {
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

export const testConfiguration = async (values, spaceId) => {
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

        if (!response.ok) {
            const raw = errorMessages(payload, `HTTP ${response.status}`);
            const reason = classify(response.status, payload);

            console.error(
                pluginInfo.id,
                "connection test failed",
                raw.join(" "),
            );

            return {
                type: TEST_RESULT.BLOCKING,
                messages: [
                    bannerMessageFor(reason, i18n.t("Test.Unreachable")),
                ],
                reason,
            };
        }

        if (!payload?.title || !payload?.alt) {
            return {
                type: TEST_RESULT.WARNING,
                messages: [i18n.t("Test.EmptyResponse")],
                response: JSON.stringify(payload),
            };
        }

        return { type: TEST_RESULT.SUCCESS, messages: [] };
    } catch (error) {
        return {
            type: TEST_RESULT.BLOCKING,
            messages: [
                error.name === "AbortError"
                    ? i18n.t("Test.TimedOut")
                    : i18n.t("Test.Unreachable"),
            ],
        };
    }
};

export const fetchModels = async (values, spaceId) => {
    try {
        const { response, payload } = await workerFetch("/models", {
            token: values.flotiq_api_key,
            spaceId,
            method: "POST",
            body: {
                ai_url: values.ai_url,
                ai_key: values.api_key,
                space_id: spaceId,
            },
        });

        if (!response.ok) {
            console.error(pluginInfo.id, "listing models", response.status);
            return { ok: false, models: [] };
        }

        return { ok: true, models: payload?.models || [] };
    } catch (error) {
        console.error(pluginInfo.id, "listing models", error);
        return { ok: false, models: [] };
    }
};

export const fetchLogs = async (
    { token, spaceId },
    { page = 1, limit = 20 } = {},
) => {
    const params = new URLSearchParams({ final_only: "1", page, limit });

    try {
        const { response, payload } = await workerFetch(
            `/logs/${spaceId}?${params}`,
            { token, spaceId },
        );

        if (!response.ok) {
            console.error(pluginInfo.id, "fetching logs", response.status);
            return { ok: false, entries: [] };
        }

        return {
            ok: true,
            entries: toSpaceEntries(payload?.data || [], TEST_JOB_ID),
            page: Number(payload?.current_page) || page,
            totalPages: Number(payload?.total_pages) || 1,
        };
    } catch (error) {
        console.error(pluginInfo.id, "fetching logs", error);
        return { ok: false, entries: [] };
    }
};

export const JOB_STATUS = {
    GENERATING: "generating",
    REGENERATING: "error (regenerating)",
    SUCCESS: "success",
    ERROR: "error",
    CANCELED: "canceled",
};

export const isActiveStatus = (status) =>
    status === JOB_STATUS.GENERATING || status === JOB_STATUS.REGENERATING;

export const generateMedia = async (
    settings,
    { mediaId, spaceId, language, fields, trigger },
) => {
    try {
        const { response, payload } = await workerFetch("/generate", {
            token: settings.flotiq_api_key,
            spaceId,
            method: "POST",
            body: {
                ai_url: settings.ai_url,
                ai_key: settings.api_key,
                model_name: settings.model,
                media_id: mediaId,
                space_id: spaceId,
                language,
                fields,
                trigger,
            },
        });

        if (!response.ok) {
            const messages = errorMessages(payload, `HTTP ${response.status}`);

            console.error(
                pluginInfo.id,
                "starting generation",
                messages.join(" "),
            );

            return { ok: false, message: messages.join(" ") };
        }

        return { ok: true, inProgress: response.status === 202 };
    } catch (error) {
        console.error(pluginInfo.id, "starting generation", error);
        return { ok: false, message: i18n.t("Test.Unreachable") };
    }
};

export const fetchJobStatus = async ({ token, spaceId, mediaId }) => {
    try {
        const { response, payload } = await workerFetch(
            `/status/${spaceId}/${mediaId}`,
            { token, spaceId },
        );

        if (response.status === 404) return { ok: true, status: null };

        if (!response.ok) {
            console.error(
                pluginInfo.id,
                "fetching job status",
                response.status,
            );
            return { ok: false, status: null };
        }

        return {
            ok: true,
            status: payload?.status || null,
            error: payload?.error || "",
        };
    } catch (error) {
        console.error(pluginInfo.id, "fetching job status", error);
        return { ok: false, status: null };
    }
};

export const fetchMediaLogs = async (
    { token, spaceId, mediaId },
    { limit = 20 } = {},
) => {
    const params = new URLSearchParams({
        exclude_tests: "1",
        final_only: "1",
        limit,
    });

    try {
        const { response, payload } = await workerFetch(
            `/logs/${spaceId}/${mediaId}?${params}`,
            { token, spaceId },
        );

        if (!response.ok) {
            console.error(
                pluginInfo.id,
                "fetching media logs",
                response.status,
            );
            return { ok: false, entries: [] };
        }

        return { ok: true, entries: toGenerationEntries(payload?.data || []) };
    } catch (error) {
        console.error(pluginInfo.id, "fetching media logs", error);
        return { ok: false, entries: [] };
    }
};
