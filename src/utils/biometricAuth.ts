import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricKind = 'fingerprint' | 'facial' | 'iris' | 'none';

export type BiometricSupport = {
  available: boolean;
  enrolled: boolean;
  kind: BiometricKind;
  /** User-facing label, preferring fingerprint when the device supports it. */
  label: string;
};

function resolveBiometricKind(
  types: LocalAuthentication.AuthenticationType[],
): BiometricKind {
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'fingerprint';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'facial';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'iris';
  }
  return 'none';
}

function labelForKind(kind: BiometricKind): string {
  switch (kind) {
    case 'fingerprint':
      return 'Fingerprint';
    case 'facial':
      return 'Face ID';
    case 'iris':
      return 'Iris scan';
    default:
      return 'Biometrics';
  }
}

export async function getBiometricSupport(): Promise<BiometricSupport> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) {
    return { available: false, enrolled: false, kind: 'none', label: 'Biometrics' };
  }

  const enrolled = await LocalAuthentication.isEnrolledAsync();
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  const kind = resolveBiometricKind(types);

  return {
    available: kind !== 'none',
    enrolled,
    kind,
    label: labelForKind(kind),
  };
}

export async function authenticateWithBiometric(prompt?: string): Promise<boolean> {
  const support = await getBiometricSupport();
  if (!support.available || !support.enrolled) {
    return false;
  }

  const defaultPrompt =
    support.kind === 'fingerprint'
      ? 'Sign in with your fingerprint'
      : `Sign in with ${support.label.toLowerCase()}`;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: prompt ?? defaultPrompt,
    cancelLabel: 'Cancel',
    disableDeviceFallback: true,
  });

  return result.success;
}
