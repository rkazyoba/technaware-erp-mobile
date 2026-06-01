import * as SecureStore from 'expo-secure-store';

const PREFIX = 'erp_mobile_summary_secure_v1:';

function storageKey(userId: string): string {
  const id = userId.trim();
  if (id === '') {
    return `${PREFIX}anonymous`;
  }
  return `${PREFIX}${id}`;
}

export async function loadMobileSummaryCache(userId: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(storageKey(userId));
  } catch {
    return null;
  }
}

export async function saveMobileSummaryCache(userId: string, json: string): Promise<void> {
  await SecureStore.setItemAsync(storageKey(userId), json);
}

export async function clearMobileSummaryCache(userId: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(storageKey(userId));
  } catch {
    /* missing */
  }
}
