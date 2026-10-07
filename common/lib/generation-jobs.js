import { fetchJobStatus, isActiveStatus, JOB_STATUS } from "../api/ai-worker";

const POLL_INTERVAL_MS = 5000;
const TIMEOUT_MS = 10 * 60 * 1000;

export const RESULT = {
    SUCCESS: "success",
    ERROR: "error",
    TIMEOUT: "timeout",
    START_FAILED: "start_failed",
};

const jobs = new Map();
const subscribers = new Set();

export const notifyChange = (mediaId) =>
    subscribers.forEach((fn) => fn(mediaId));

export const subscribe = (fn) => {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
};

export const isGenerating = (mediaId) => jobs.has(mediaId);

export const getJobFields = (mediaId) => jobs.get(mediaId)?.fields;

const resultFor = (status) =>
    status === JOB_STATUS.SUCCESS ? RESULT.SUCCESS : RESULT.ERROR;

/**
 * Polls the worker every 5 seconds until the job leaves the active statuses.
 * A failed request is retried on the next tick - only the timeout ends
 * polling without a final status. The job counts as running until `onFinish`
 * settles, so the form stays locked while it takes the new values over.
 */
export const trackJob = (
    mediaId,
    { token, spaceId, fields, start },
    onFinish,
) => {
    if (jobs.has(mediaId)) return;

    const job = { startedAt: Date.now(), timer: null, fields };
    jobs.set(mediaId, job);
    notifyChange(mediaId);

    const finish = async (result, message) => {
        try {
            await onFinish(result, message);
        } finally {
            jobs.delete(mediaId);
            notifyChange(mediaId);
        }
    };

    const poll = async () => {
        const { ok, status, error } = await fetchJobStatus({
            token,
            spaceId,
            mediaId,
        });

        if (ok && !isActiveStatus(status)) {
            finish(resultFor(status), error);
            return;
        }

        if (Date.now() - job.startedAt >= TIMEOUT_MS) {
            finish(RESULT.TIMEOUT);
            return;
        }

        job.timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    const begin = async () => {
        if (start) {
            const result = await start;

            if (!result?.ok) {
                finish(RESULT.START_FAILED, result?.message);
                return;
            }

            job.startedAt = Date.now();
        }

        job.timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    begin();
};
