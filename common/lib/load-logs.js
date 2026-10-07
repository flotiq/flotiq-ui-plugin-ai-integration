import { fetchLogs } from "../api/ai-worker";
import {
    setEntries,
    setEntriesError,
    setLoadingEntries,
} from "../connection-store";

let generation = 0;

let lastRequest = null;

export const loadLogs = async (token, spaceId, page = 1) => {
    const current = ++generation;

    if (!token || !spaceId) {
        lastRequest = null;
        setEntries([]);
        return;
    }

    lastRequest = { token, spaceId };

    setLoadingEntries(true);

    const { ok, entries, ...pagination } = await fetchLogs(
        { token, spaceId },
        { page },
    );

    if (current !== generation) return;

    if (!ok) {
        setEntriesError();
        return;
    }

    setEntries(entries, pagination);
};

export const loadLogsPage = (page) => {
    if (!lastRequest) return;
    loadLogs(lastRequest.token, lastRequest.spaceId, page);
};
