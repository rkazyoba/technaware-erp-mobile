import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** LAN host of the Metro / Expo dev server (same machine that should run Laravel). */
export function resolveDevLanHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) {
    return null;
  }
  const host = hostUri.split(':')[0]?.trim();
  if (!host) {
    return null;
  }
  if (host === 'localhost' || host === '127.0.0.1') {
    return Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
  }
  return host;
}

/**
 * API base URL ending with `/api/v1`.
 * Prefers `EXPO_PUBLIC_API_BASE_URL`, then `expo.extra.apiBaseUrl`, then dev LAN host.
 */
export function resolveApiBaseUrl(): string {
  const fromEnv = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, '');
  }

  const fromExtra = (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined)?.trim();
  if (fromExtra) {
    return fromExtra.replace(/\/+$/, '');
  }

  if (__DEV__) {
    const devHost = resolveDevLanHost();
    if (devHost) {
      return `http://${devHost}:8000/api/v1`;
    }
  }

  return '';
}
