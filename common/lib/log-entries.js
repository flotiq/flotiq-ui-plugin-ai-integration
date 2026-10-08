const toEntry = (log) => ({
    timestamp: log.finished_at || log.started_at,
    type: "connection_test",
    status: log.status === "success" ? "succeeded" : "failed",
    attempts: Number(log.attempts) || 1,
    durationMs: Number(log.duration_ms) || 0,
    message: log.errors || "",
    log,
});

const isFinalGenerationLog = (log) =>
    log.status === "success" || log.status === "error";

const newestFirst = (a, b) => new Date(b.timestamp) - new Date(a.timestamp);

const toGenerationEntry = (log) => ({
    timestamp: log.finished_at || log.started_at,
    status: log.status === "success" ? "succeeded" : "failed",
    attempts: Number(log.attempts) || 1,
    durationMs: Number(log.duration_ms) || 0,
    message: log.status === "error" ? log.errors || "" : "",
    log,
});

export const toGenerationEntries = (logs) =>
    logs.filter(isFinalGenerationLog).map(toGenerationEntry).sort(newestFirst);

export const toSpaceEntries = (logs, testJobId) =>
    logs
        .flatMap((log) => {
            if (log.job_id === testJobId) return [toEntry(log)];
            if (!isFinalGenerationLog(log)) return [];

            return [
                {
                    ...toGenerationEntry(log),
                    type:
                        log.trigger === "auto"
                            ? "auto_generate"
                            : "manual_generation",
                },
            ];
        })
        .sort(newestFirst);
