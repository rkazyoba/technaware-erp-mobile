import {
  clearPortalSnapshot,
  loadPortalSnapshot,
  savePortalSnapshot,
  type PortalSnapshotEnvelope,
} from './portalSnapshotStorage';

const SNAPSHOT_KEY = 'mobile_summary';

export async function loadMobileSummaryCache(userId: string): Promise<string | null> {
  const envelope = await loadPortalSnapshot<unknown>(userId, SNAPSHOT_KEY);
  if (!envelope) {
    return null;
  }
  return JSON.stringify(envelope);
}

export async function saveMobileSummaryCache(userId: string, json: string): Promise<void> {
  try {
    const parsed = JSON.parse(json) as PortalSnapshotEnvelope<unknown>;
    if (parsed && typeof parsed.networkAt === 'number' && parsed.data !== undefined) {
      await savePortalSnapshot(userId, SNAPSHOT_KEY, parsed);
    }
  } catch {
    /* ignore */
  }
}

export async function clearMobileSummaryCache(userId: string): Promise<void> {
  await clearPortalSnapshot(userId, SNAPSHOT_KEY);
}
