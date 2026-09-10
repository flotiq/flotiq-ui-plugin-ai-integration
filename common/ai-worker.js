import pluginInfo from "../plugin-manifest.json";
import i18n from "../i18n";
import {
    bannerMessageFor,
    classify,
    errorMessages,
    toEntry,
} from "./ai-worker-helpers";

// Injected by esbuild - falls back to production, dev overrides it with
// WORKER_URL=http://localhost:8787 (see esbuild.config.js).
const WORKER_URL = process.env.WORKER_URL;

const TIMEOUT_MS = 300000;

export const TEST_JOB_ID = "test";

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

            console.error(pluginInfo.id, "connection test failed", raw.join(" "));

            return {
                type: TEST_RESULT.BLOCKING,
                messages: [bannerMessageFor(reason, i18n.t("Test.Unreachable"))],
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

/**
 * Connection tests only. `job_id` is fixed instead of being a parameter,
 * because the Logs tab has nothing to say about generation jobs yet.
 */
export const fetchLogs = async ({ token, spaceId }, { limit = 20 } = {}) => {
    const params = new URLSearchParams({ job_id: TEST_JOB_ID, limit });

    try {
        const { response, payload } = await workerFetch(
            `/logs/${spaceId}?${params}`,
            { token, spaceId },
        );

        if (!response.ok) {
            console.error(pluginInfo.id, "fetching logs", response.status);
            return { ok: false, entries: [] };
        }

        const entries = (payload?.data || [])
            .map(toEntry)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return { ok: true, entries };
    } catch (error) {
        console.error(pluginInfo.id, "fetching logs", error);
        return { ok: false, entries: [] };
    }
};
