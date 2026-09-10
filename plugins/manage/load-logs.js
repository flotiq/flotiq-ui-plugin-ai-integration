import { fetchLogs } from "../../common/ai-worker";
import {
    setEntries,
    setEntriesError,
    setLoadingEntries,
} from "../../common/connection-store";

let generation = 0;

export const loadLogs = async (token, spaceId) => {
    const current = ++generation;

    if (!token || !spaceId) {
        setEntries([]);
        return;
    }

    setLoadingEntries(true);

    const { ok, entries } = await fetchLogs({ token, spaceId });

    if (current !== generation) return;

    if (!ok) {
        setEntriesError();
        return;
    }

    setEntries(entries);
};
