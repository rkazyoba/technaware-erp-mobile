import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'erp_mobile_auth_token_v1';
const USER_JSON_KEY = 'erp_mobile_auth_user_v1';
const SAVED_USERNAME_KEY = 'erp_mobile_saved_username_v1';

export async function persistAuthSession(token: string, userJson: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_JSON_KEY, userJson);
}

export async function loadAuthSession(): Promise<{ token: string; userJson: string } | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const userJson = await SecureStore.getItemAsync(USER_JSON_KEY);
  if (!token || !userJson) {
    return null;
  }
  return { token, userJson };
}

export async function clearAuthSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    /* missing key */
  }
  try {
    await SecureStore.deleteItemAsync(USER_JSON_KEY);
  } catch {
    /* missing key */
  }
}

export async function saveRememberedUsername(username: string): Promise<void> {
  const trimmed = username.trim();
  if (!trimmed) {
    await SecureStore.deleteItemAsync(SAVED_USERNAME_KEY);
    return;
  }
  await SecureStore.setItemAsync(SAVED_USERNAME_KEY, trimmed);
}

export async function clearRememberedUsername(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SAVED_USERNAME_KEY);
  } catch {
    /* missing key */
  }
}

export async function loadRememberedUsername(): Promise<string | null> {
  return SecureStore.getItemAsync(SAVED_USERNAME_KEY);
}
