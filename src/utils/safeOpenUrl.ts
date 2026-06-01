import { Linking } from 'react-native';
import { API_BASE_URL } from '../api';

function allowedOrigins(): string[] {
  const origins = new Set<string>();
  try {
    const api = new URL(API_BASE_URL);
    origins.add(api.origin);
    const webBase = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
    if (webBase !== API_BASE_URL) {
      origins.add(new URL(webBase).origin);
    }
  } catch {
    /* ignore malformed base URL */
  }
  return [...origins];
}

/**
 * Opens a URL only when it uses https (or http in dev) and matches the configured ERP host(s).
 */
export function isSafeExternalUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed === '') {
    return false;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return false;
  }

  if (parsed.protocol === 'http:' && !__DEV__) {
    return false;
  }

  const origins = allowedOrigins();
  if (origins.length === 0) {
    return false;
  }

  return origins.includes(parsed.origin);
}

export async function safeOpenUrl(url: string): Promise<boolean> {
  if (!isSafeExternalUrl(url)) {
    return false;
  }
  const can = await Linking.canOpenURL(url);
  if (!can) {
    return false;
  }
  await Linking.openURL(url);
  return true;
}
