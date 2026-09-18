import * as SecureStore from 'expo-secure-store';

const DEVICE_UID_KEY = 'erp_mobile_device_uid_v1';
const DEVICE_REG_KEY = 'erp_mobile_device_reg_v1';
const DEVICE_PIN_KEY = 'erp_mobile_device_pin_v1';

export type DeviceRegistration = {
  userId: number;
  userName: string;
  username: string;
  biometricEnabled: boolean;
};

function generateDeviceUid(): string {
  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return template.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export async function getOrCreateDeviceUid(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DEVICE_UID_KEY);
  if (existing?.trim()) {
    return existing.trim();
  }

  const next = generateDeviceUid();
  await SecureStore.setItemAsync(DEVICE_UID_KEY, next);
  return next;
}

export async function loadDeviceRegistration(): Promise<DeviceRegistration | null> {
  const raw = await SecureStore.getItemAsync(DEVICE_REG_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as DeviceRegistration;
    if (!parsed.userId || !parsed.userName) {
      return null;
    }
    return {
      userId: Number(parsed.userId),
      userName: String(parsed.userName),
      username: String(parsed.username ?? ''),
      biometricEnabled: parsed.biometricEnabled === true,
    };
  } catch {
    return null;
  }
}

export async function saveDeviceRegistration(registration: DeviceRegistration): Promise<void> {
  await SecureStore.setItemAsync(DEVICE_REG_KEY, JSON.stringify(registration));
}

export async function saveDevicePinForBiometric(pin: string): Promise<void> {
  await SecureStore.setItemAsync(DEVICE_PIN_KEY, pin);
}

export async function loadDevicePinForBiometric(): Promise<string | null> {
  return SecureStore.getItemAsync(DEVICE_PIN_KEY);
}

export async function clearDevicePinForBiometric(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(DEVICE_PIN_KEY);
  } catch {
    /* missing key */
  }
}

export async function clearDeviceRegistration(): Promise<void> {
  await clearDevicePinForBiometric();
  try {
    await SecureStore.deleteItemAsync(DEVICE_REG_KEY);
  } catch {
    /* missing key */
  }
}

export function isDeviceRegisteredForUser(
  registration: DeviceRegistration | null,
  userId: number,
): boolean {
  return registration !== null && registration.userId === userId;
}
