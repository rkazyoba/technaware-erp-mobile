import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { PinAuthShell } from '../components/PinAuthShell';
import { PinDots } from '../components/PinDots';
import { PinSecurityIcon } from '../components/PinSecurityIcon';
import { authTheme } from '../constants/authTheme';
import { pinAuthStyles as styles } from '../styles/pinAuthStyles';
import { authenticateWithBiometric, BiometricKind, getBiometricSupport } from '../utils/biometricAuth';
import { loadDevicePinForBiometric } from '../utils/deviceStorage';

type PinLoginScreenProps = {
  logoUri: string;
  userName: string;
  biometricEnabled: boolean;
  loading: boolean;
  onSubmitPin: (pin: string) => void;
  onForgotPin: () => void;
  onSwitchUser: () => void;
};

const PIN_LENGTH = 4;

export function PinLoginScreen({
  logoUri,
  userName,
  biometricEnabled,
  loading,
  onSubmitPin,
  onForgotPin,
  onSwitchUser,
}: PinLoginScreenProps) {
  const [pin, setPin] = useState('');
  const [logoFailed, setLogoFailed] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Fingerprint');
  const [biometricKind, setBiometricKind] = useState<BiometricKind>('fingerprint');
  const [biometricReady, setBiometricReady] = useState(false);
  const biometricAttemptedRef = useRef(false);

  const submitPin = useCallback(
    (nextPin: string) => {
      if (loading || nextPin.length !== PIN_LENGTH) {
        return;
      }
      onSubmitPin(nextPin);
    },
    [loading, onSubmitPin],
  );

  const handleDigit = (digit: string) => {
    if (loading) {
      return;
    }
    setPin((current) => {
      if (current.length >= PIN_LENGTH) {
        return current;
      }
      const next = `${current}${digit}`;
      if (next.length === PIN_LENGTH) {
        setTimeout(() => submitPin(next), 0);
      }
      return next;
    });
  };

  const handleBackspace = () => {
    if (loading) {
      return;
    }
    setPin((current) => current.slice(0, -1));
  };

  const handleBiometric = useCallback(async () => {
    if (!biometricEnabled || !biometricReady || loading) {
      return;
    }

    const ok = await authenticateWithBiometric();
    if (!ok) {
      return;
    }

    const storedPin = await loadDevicePinForBiometric();
    if (!storedPin || storedPin.length !== PIN_LENGTH) {
      return;
    }

    submitPin(storedPin);
  }, [biometricEnabled, biometricReady, loading, submitPin]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const support = await getBiometricSupport();
      if (cancelled) {
        return;
      }
      setBiometricLabel(support.label);
      setBiometricKind(support.kind);
      setBiometricReady(support.available && support.enrolled);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!biometricEnabled || !biometricReady || loading || biometricAttemptedRef.current) {
      return;
    }

    biometricAttemptedRef.current = true;
    void handleBiometric();
  }, [biometricEnabled, biometricReady, handleBiometric, loading]);

  useEffect(() => {
    if (!loading) {
      setPin('');
    }
  }, [loading]);

  const showBiometric = biometricEnabled && biometricReady;
  const firstName = userName.trim().split(/\s+/)[0] || userName;
  const biometricIconName = biometricKind === 'facial' ? 'face-recognition' : 'fingerprint';
  const biometricHint =
    biometricKind === 'fingerprint'
      ? 'Tap to sign in with fingerprint'
      : `Tap to sign in with ${biometricLabel.toLowerCase()}`;

  return (
    <PinAuthShell
      keypadDisabled={loading}
      onDigit={handleDigit}
      onBackspace={handleBackspace}
      header={
        <View style={styles.brandWrap}>
          {!logoFailed ? (
            <Image
              source={{ uri: logoUri }}
              style={styles.loginLogo}
              resizeMode="contain"
              accessibilityLabel="Technaware logo"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <View style={styles.loginLogoFallback}>
              <Text style={styles.loginLogoFallbackTitle}>TECHNAWARE</Text>
              <Text style={styles.loginLogoFallbackTagline}>We offer Solutions</Text>
            </View>
          )}

          <PinSecurityIcon />

          <Text style={styles.pinHeading}>Enter your PIN</Text>
          <Text style={styles.welcomeText}>Welcome back, {firstName}</Text>
          <PinDots length={pin.length} maxLength={PIN_LENGTH} />

          <View style={styles.metaRow}>
            <Pressable onPress={onForgotPin} disabled={loading}>
              <Text style={styles.metaLink}>Forgot PIN?</Text>
            </Pressable>
            <Pressable onPress={onSwitchUser} disabled={loading}>
              <Text style={styles.metaLink}>Not {firstName}?</Text>
            </Pressable>
          </View>

          {showBiometric ? (
            <View style={styles.biometricWrap}>
              <Pressable
                style={[styles.biometricButton, loading ? styles.biometricButtonDisabled : null]}
                onPress={() => void handleBiometric()}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel={`Sign in with ${biometricLabel}`}
              >
                <MaterialCommunityIcons name={biometricIconName} size={34} color={authTheme.accent} />
              </Pressable>
              <Text style={styles.biometricHint}>{biometricHint}</Text>
            </View>
          ) : null}
        </View>
      }
    />
  );
}
