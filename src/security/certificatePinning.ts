/**
 * Certificate pinning requires a custom native build (not available in standard Expo Go).
 * Set EXPO_PUBLIC_SSL_PIN_SHA256 to the base64 SHA-256 hash of the API certificate SPKI
 * and implement verification in your native networking layer or via a config plugin.
 *
 * @see https://docs.expo.dev/guides/customizing-metadata/
 */
export function readConfiguredCertificatePin(): string | null {
  const pin = (process.env.EXPO_PUBLIC_SSL_PIN_SHA256 ?? '').trim();
  return pin !== '' ? pin : null;
}

export function certificatePinningRequiredInProduction(): boolean {
  return !__DEV__ && readConfiguredCertificatePin() === null;
}
