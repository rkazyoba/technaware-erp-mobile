import * as SecureStore from 'expo-secure-store';
import { clearPortalBootstrap } from './portalBootstrapStorage';

const PREFIX = 'erp_portal_snapshot_v1:';

export const PORTAL_SNAPSHOT_DISK_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type PortalSnapshotEnvelope<T> = {
  networkAt: number;
  data: T;
};

function storageKey(userId: string, snapshotKey: string): string {
  const id = userId.trim() || 'anonymous';
  const key = snapshotKey.trim().replace(/[^a-zA-Z0-9:_-]/g, '_');
  return `${PREFIX}${id}:${key}`;
}

export function isPortalSnapshotFresh(networkAt: number, maxAgeMs = PORTAL_SNAPSHOT_DISK_MAX_AGE_MS): boolean {
  return typeof networkAt === 'number' && Date.now() - networkAt <= maxAgeMs;
}

export async function loadPortalSnapshot<T>(userId: string, snapshotKey: string): Promise<PortalSnapshotEnvelope<T> | null> {
  try {
    const raw = await SecureStore.getItemAsync(storageKey(userId, snapshotKey));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PortalSnapshotEnvelope<T>;
    if (!parsed || typeof parsed.networkAt !== 'number' || parsed.data === undefined) {
      return null;
    }
    if (!isPortalSnapshotFresh(parsed.networkAt)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function savePortalSnapshot<T>(userId: string, snapshotKey: string, envelope: PortalSnapshotEnvelope<T>): Promise<void> {
  try {
    await SecureStore.setItemAsync(storageKey(userId, snapshotKey), JSON.stringify(envelope));
  } catch {
    /* ignore persist errors */
  }
}

export async function persistPortalSnapshot<T>(userId: string, snapshotKey: string, data: T): Promise<number> {
  const networkAt = Date.now();
  await savePortalSnapshot(userId, snapshotKey, { networkAt, data });
  return networkAt;
}

export async function clearPortalSnapshot(userId: string, snapshotKey: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(storageKey(userId, snapshotKey));
  } catch {
    /* missing */
  }
}

/** Known snapshot keys cleared on logout (SecureStore has no key listing). */
export const PORTAL_SNAPSHOT_KEY_PREFIXES = [
  'mobile_summary',
  'approvals',
  'logistics:',
  'hr:leave_requests',
  'hr:leave_approval_queue:',
  'finance:customer_invoices',
  'finance:proforma_invoices',
  'finance:customer_payments',
  'finance:payment_vouchers',
  'finance:supplier_invoices',
] as const;

export function logisticsSnapshotKey(basePath: string, query = ''): string {
  return `logistics:${basePath}:${query}`;
}

export function approvalsSnapshotKey(kindFilter?: string): string {
  const kind = kindFilter?.trim();
  return kind ? `approvals:${kind}` : 'approvals';
}

export function leaveApprovalQueueSnapshotKey(route: string): string {
  return `hr:leave_approval_queue:${route}`;
}

export async function clearAllPortalSnapshotsForUser(userId: string): Promise<void> {
  const id = userId.trim();
  if (id === '') {
    return;
  }
  await Promise.all([
    clearPortalBootstrap(id),
    clearPortalSnapshot(id, 'mobile_summary'),
    clearPortalSnapshot(id, 'approvals'),
    clearPortalSnapshot(id, 'hr:leave_requests'),
    clearPortalSnapshot(id, 'finance:customer_invoices'),
    clearPortalSnapshot(id, 'finance:proforma_invoices'),
    clearPortalSnapshot(id, 'finance:customer_payments'),
    clearPortalSnapshot(id, 'finance:payment_vouchers'),
    clearPortalSnapshot(id, 'finance:supplier_invoices'),
    clearPortalSnapshot(id, 'hr:leave_approval_queue:Team leave approvals'),
    clearPortalSnapshot(id, 'hr:leave_approval_queue:HR leave approvals'),
    // Legacy mobile summary key
    SecureStore.deleteItemAsync(`erp_mobile_summary_secure_v1:${id}`).catch(() => {}),
  ]);
}
