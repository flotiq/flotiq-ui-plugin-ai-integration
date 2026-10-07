import { fetchLogs } from "../../../common/ai-worker";
import {
    setEntries,
    setEntriesError,
    setLoadingEntries,
} from "../../../common/connection-store";

let generation = 0;

/** Credentials of the last load, reused to switch pages of the Logs tab */
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
