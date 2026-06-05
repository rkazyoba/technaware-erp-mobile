import * as SecureStore from 'expo-secure-store';
import type { MobilePortalBootstrap } from '../types/app';
import { isPortalSnapshotFresh } from './portalSnapshotStorage';

const PREFIX = 'erp_portal_bootstrap_v1:';

function storageKey(userId: string): string {
  const id = userId.trim() || 'anonymous';
  return `${PREFIX}${id}`;
}

type StoredPortalBootstrap = {
  networkAt: number;
  portal: MobilePortalBootstrap;
};

export async function loadPortalBootstrap(userId: string): Promise<MobilePortalBootstrap | null> {
  try {
    const raw = await SecureStore.getItemAsync(storageKey(userId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredPortalBootstrap;
    if (!parsed?.portal || typeof parsed.networkAt !== 'number') {
      return null;
    }
    if (!isPortalSnapshotFresh(parsed.networkAt)) {
      return null;
    }
    return parsed.portal;
  } catch {
    return null;
  }
}

export async function savePortalBootstrap(userId: string, portal: MobilePortalBootstrap): Promise<void> {
  const id = userId.trim();
  if (id === '') {
    return;
  }
  try {
    const payload: StoredPortalBootstrap = { networkAt: Date.now(), portal };
    await SecureStore.setItemAsync(storageKey(id), JSON.stringify(payload));
  } catch {
    /* ignore persist errors */
  }
}

export async function clearPortalBootstrap(userId: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(storageKey(userId));
  } catch {
    /* missing */
  }
}
