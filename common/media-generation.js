import { fetchJobStatus, isActiveStatus, JOB_STATUS } from "./ai-worker";

const POLL_INTERVAL_MS = 5000;
const TIMEOUT_MS = 10 * 60 * 1000;

export const RESULT = {
    SUCCESS: "success",
    ERROR: "error",
    TIMEOUT: "timeout",
};

/**
 * Jobs tracked in this browser tab, by media id. Kept outside the panel, so
 * polling goes on when the user leaves the editor and the spinner comes back
 * when they return.
 */
const jobs = new Map();
const subscribers = new Set();

const notify = (mediaId) => subscribers.forEach((fn) => fn(mediaId));

export const subscribe = (fn) => {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
};

export const isGenerating = (mediaId) => jobs.has(mediaId);

/** Fields the running job writes, `undefined` when not known */
export const getJobFields = (mediaId) => jobs.get(mediaId)?.fields;

const resultFor = (status) =>
    status === JOB_STATUS.SUCCESS ? RESULT.SUCCESS : RESULT.ERROR;

/**
 * Polls the worker every 5 seconds until the job leaves the active statuses.
 * A failed request is retried on the next tick - only the timeout ends
 * polling without a final status. The job counts as running until `onFinish`
 * settles, so the form stays locked while it takes the new values over.
 */
export const trackJob = (mediaId, { token, spaceId, fields }, onFinish) => {
    if (jobs.has(mediaId)) return;

    const job = { startedAt: Date.now(), timer: null, fields };
    jobs.set(mediaId, job);
    notify(mediaId);

    const finish = async (result) => {
        try {
            await onFinish(result);
        } finally {
            jobs.delete(mediaId);
            notify(mediaId);
        }
    };

    const poll = async () => {
        const { ok, status } = await fetchJobStatus({
            token,
            spaceId,
            mediaId,
        });

        if (ok && !isActiveStatus(status)) {
            finish(resultFor(status));
            return;
        }

        if (Date.now() - job.startedAt >= TIMEOUT_MS) {
            finish(RESULT.TIMEOUT);
            return;
        }

        job.timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    job.timer = setTimeout(poll, POLL_INTERVAL_MS);
};
