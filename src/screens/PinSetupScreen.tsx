import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { PinAuthShell } from '../components/PinAuthShell';
import { PinDots } from '../components/PinDots';
import { PinSecurityIcon } from '../components/PinSecurityIcon';
import { pinAuthStyles as styles } from '../styles/pinAuthStyles';
import { BiometricKind, getBiometricSupport } from '../utils/biometricAuth';

type PinSetupScreenProps = {
  logoUri: string;
  userName: string;
  loading: boolean;
  onComplete: (pin: string, biometricEnabled: boolean) => void;
  onPinMismatch: () => void;
  onCancel: () => void;
};

const PIN_LENGTH = 4;

export function PinSetupScreen({
  logoUri,
  userName,
  loading,
  onComplete,
  onPinMismatch,
  onCancel,
}: PinSetupScreenProps) {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [draftPin, setDraftPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [logoFailed, setLogoFailed] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Fingerprint');
  const [biometricKind, setBiometricKind] = useState<BiometricKind>('fingerprint');

  const activePin = step === 'create' ? draftPin : confirmPin;
  const firstName = userName.trim().split(/\s+/)[0] || userName;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const support = await getBiometricSupport();
      if (cancelled) {
        return;
      }
      setBiometricAvailable(support.available && support.enrolled);
      setBiometricLabel(support.label);
      setBiometricKind(support.kind);
      setBiometricEnabled(support.available && support.enrolled);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const resetPins = () => {
    setDraftPin('');
    setConfirmPin('');
    setStep('create');
  };

  const handleDigit = (digit: string) => {
    if (loading) {
      return;
    }

    if (step === 'create') {
      setDraftPin((current) => {
        if (current.length >= PIN_LENGTH) {
          return current;
        }
        const next = `${current}${digit}`;
        if (next.length === PIN_LENGTH) {
          setTimeout(() => setStep('confirm'), 120);
        }
        return next;
      });
      return;
    }

    setConfirmPin((current) => {
      if (current.length >= PIN_LENGTH) {
        return current;
      }
      const next = `${current}${digit}`;
      if (next.length === PIN_LENGTH) {
        setTimeout(() => {
          if (draftPin !== next) {
            onPinMismatch();
            resetPins();
            return;
          }
          onComplete(draftPin, biometricEnabled && biometricAvailable);
        }, 0);
      }
      return next;
    });
  };

  const handleBackspace = () => {
    if (loading) {
      return;
    }

    if (step === 'create') {
      setDraftPin((current) => current.slice(0, -1));
      return;
    }

    setConfirmPin((current) => {
      if (current.length === 0) {
        setStep('create');
        return draftPin.slice(0, -1);
      }
      return current.slice(0, -1);
    });
  };

  const biometricSetupHint =
    biometricKind === 'fingerprint'
      ? 'Use your fingerprint for faster sign-in'
      : 'Use biometrics for faster sign-in';

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

          <Text style={styles.pinHeading}>{step === 'create' ? 'Create your PIN' : 'Confirm your PIN'}</Text>
          <Text style={styles.welcomeText}>Hi {firstName}, secure this device with a 4-digit PIN</Text>
          <PinDots length={activePin.length} maxLength={PIN_LENGTH} />
          <Text style={styles.setupHint}>
            {step === 'create'
              ? 'Choose a PIN you will remember. You will use it to sign in on this phone.'
              : 'Enter the same PIN again to confirm.'}
          </Text>

          {step === 'confirm' && biometricAvailable ? (
            <Pressable
              style={styles.biometricToggleRow}
              onPress={() => setBiometricEnabled((prev) => !prev)}
              disabled={loading}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.biometricToggleLabel}>Enable {biometricLabel}</Text>
                <Text style={styles.biometricToggleHint}>{biometricSetupHint}</Text>
              </View>
              <View style={[styles.biometricToggleButton, biometricEnabled ? styles.biometricToggleButtonActive : null]}>
                <View style={[styles.biometricToggleKnob, biometricEnabled ? styles.biometricToggleKnobActive : null]} />
              </View>
            </Pressable>
          ) : null}

          <Pressable onPress={onCancel} disabled={loading} style={styles.cancelLinkWrap}>
            <Text style={[styles.metaLink, { textAlign: 'center' }]}>Use a different account</Text>
          </Pressable>
        </View>
      }
    />
  );
}
