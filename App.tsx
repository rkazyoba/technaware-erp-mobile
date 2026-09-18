import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  useFonts,
} from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar as RNStatusBar, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  API_BASE_URL,
  ApiRequestError,
  deviceLogin,
  login,
  logout,
  me,
  registerMobileDevice,
  setSessionInvalidHandler,
} from './src/api';
import { Toast, ToastType } from './src/components/Toast';
import { authTheme } from './src/constants/authTheme';
import { colors } from './src/constants/colors';
import { AppNavigator } from './src/navigation/AppNavigator';
import { NetworkStatusProvider } from './src/context/NetworkStatusContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { PinLoginScreen } from './src/screens/PinLoginScreen';
import { PinSetupScreen } from './src/screens/PinSetupScreen';
import {
  clearPortalBootstrap,
  loadPortalBootstrap,
  savePortalBootstrap,
} from './src/utils/portalBootstrapStorage';
import {
  clearAuthSession,
  clearRememberedUsername,
  loadAuthSession,
  loadRememberedUsername,
  persistAuthSession,
  saveRememberedUsername,
} from './src/sessionStorage';
import { styles } from './src/styles/appStyles';
import { MobilePortalBootstrap, RefreshProfileOptions, SignedInUser } from './src/types/app';
import {
  clearDevicePinForBiometric,
  clearDeviceRegistration,
  DeviceRegistration,
  getOrCreateDeviceUid,
  isDeviceRegisteredForUser,
  loadDeviceRegistration,
  saveDevicePinForBiometric,
  saveDeviceRegistration,
} from './src/utils/deviceStorage';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* Dev fast-refresh may hide splash before preventAutoHideAsync runs. */
});

type AuthScreen = 'credential' | 'pin_setup' | 'pin_login';

type PendingPinSetup = {
  token: string;
  user: SignedInUser;
  portal: MobilePortalBootstrap | null;
};

function AppContent() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [token, setToken] = useState('');
  const [user, setUser] = useState<SignedInUser | null>(null);
  const [portal, setPortal] = useState<MobilePortalBootstrap | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');
  const [hydrating, setHydrating] = useState(true);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('credential');
  const [deviceRegistration, setDeviceRegistration] = useState<DeviceRegistration | null>(null);
  const [deviceUid, setDeviceUid] = useState('');
  const [pendingPinSetup, setPendingPinSetup] = useState<PendingPinSetup | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Bumped on logout so in-flight /me responses cannot restore the session. */
  const authGenerationRef = useRef(0);
  /** Mirrors `token` for 401 handling so stale `/me` cannot clear a fresh login. */
  const activeTokenRef = useRef('');

  const isAuthed = useMemo(() => token.length > 0, [token]);
  const appBaseUrl = API_BASE_URL.replace('/api/v1', '');
  const logoUri = `${appBaseUrl}/backend/assets/img/logo.png`;
  const statusBarBg = isAuthed ? colors.primaryNavy : authTheme.bg;

  useEffect(() => {
    activeTokenRef.current = token;
  }, [token]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
      toastTimerRef.current = null;
    }, 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded && !hydrating) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, hydrating]);

  const clearSignedInState = useCallback(async (userId = '') => {
    if (userId !== '') {
      await clearPortalBootstrap(userId);
    }
    await clearAuthSession();
    setToken('');
    setUser(null);
    setPortal(null);
    setPassword('');
  }, []);

  const completeAuthentication = useCallback(
    async (nextToken: string, nextUser: SignedInUser, nextPortal: MobilePortalBootstrap | null | undefined) => {
      authGenerationRef.current += 1;
      activeTokenRef.current = nextToken;
      setToken(nextToken);
      setUser(nextUser);
      setPortal(nextPortal ?? null);
      await persistAuthSession(nextToken, JSON.stringify(nextUser));
      if (nextPortal) {
        await savePortalBootstrap(String(nextUser.id), nextPortal);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    setSessionInvalidHandler((failedToken) => {
      if (failedToken !== activeTokenRef.current) {
        return;
      }
      authGenerationRef.current += 1;
      void (async () => {
        await clearSignedInState(String(user?.id ?? ''));
        const registration = await loadDeviceRegistration();
        setDeviceRegistration(registration);
        setPendingPinSetup(null);
        setLoading(false);
        setAuthScreen(registration ? 'pin_login' : 'credential');
        setToastMessage('Session expired. Please sign in again.');
        setToastType('info');
        setToastVisible(true);
      })();
    });

    (async () => {
      try {
        const [session, rememberedUsername, registration, uid] = await Promise.all([
          loadAuthSession(),
          loadRememberedUsername(),
          loadDeviceRegistration(),
          getOrCreateDeviceUid(),
        ]);
        if (cancelled) {
          return;
        }

        setDeviceUid(uid);
        setDeviceRegistration(registration);

        if (rememberedUsername) {
          setUsername(rememberedUsername);
          setRememberMe(true);
        }

        if (session?.token) {
          setToken(session.token);
          let cachedUserId = '';
          try {
            const parsed = JSON.parse(session.userJson) as SignedInUser;
            setUser(parsed);
            cachedUserId = String(parsed.id ?? '');
          } catch {
            /* ignore corrupt cache */
          }

          if (cachedUserId !== '') {
            const cachedPortal = await loadPortalBootstrap(cachedUserId);
            if (!cancelled && cachedPortal) {
              setPortal(cachedPortal);
            }
          }

          try {
            const hydrateGeneration = authGenerationRef.current;
            const profile = await me(session.token);
            if (!cancelled && hydrateGeneration === authGenerationRef.current) {
              setUser(profile.data.user);
              setPortal(profile.data.portal ?? null);
              await persistAuthSession(session.token, JSON.stringify(profile.data.user));
              if (profile.data.portal) {
                await savePortalBootstrap(String(profile.data.user.id), profile.data.portal);
              }
              setAuthScreen('credential');
            }
          } catch (err: unknown) {
            if (!cancelled && err instanceof ApiRequestError && (err.httpStatus === 401 || err.httpStatus === 403)) {
              authGenerationRef.current += 1;
              await clearSignedInState(cachedUserId);
              setAuthScreen(registration ? 'pin_login' : 'credential');
            }
            /* Network errors: keep cached user + portal so the shell loads offline. */
          }
        } else if (registration) {
          setAuthScreen('pin_login');
        } else {
          setAuthScreen('credential');
        }
      } finally {
        if (!cancelled) {
          setHydrating(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      setSessionInvalidHandler(null);
    };
  }, [clearSignedInState, user?.id]);

  const handleCredentialLogin = async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      showToast('Enter your username and password.', 'error');
      return;
    }
    if (loading) {
      return;
    }

    setLoading(true);
    const loginGeneration = authGenerationRef.current;
    try {
      const deviceName = `Technaware-Mobile/${Platform.OS}`;
      const res = await login(trimmedUsername, password, deviceName);
      if (loginGeneration !== authGenerationRef.current) {
        return;
      }

      const nextUser = res.data.user;
      const nextPortal = res.data.portal ?? null;
      const nextToken = res.data.token;

      if (rememberMe) {
        await saveRememberedUsername(trimmedUsername);
      } else {
        await clearRememberedUsername();
      }
      setPassword('');

      const registration = await loadDeviceRegistration();
      setDeviceRegistration(registration);

      if (!isDeviceRegisteredForUser(registration, nextUser.id)) {
        setPendingPinSetup({
          token: nextToken,
          user: nextUser,
          portal: nextPortal,
        });
        setAuthScreen('pin_setup');
        showToast('Create a PIN to secure this device.', 'info');
        return;
      }

      await completeAuthentication(nextToken, nextUser, nextPortal);
      showToast(`Welcome back, ${nextUser.name || nextUser.username}.`, 'success');
    } catch (error) {
      if (loginGeneration === authGenerationRef.current) {
        showToast(error instanceof Error ? error.message : 'Login failed.', 'error');
      }
    } finally {
      if (loginGeneration === authGenerationRef.current) {
        setLoading(false);
      }
    }
  };

  const handlePinSetupComplete = async (pin: string, biometricEnabled: boolean) => {
    if (!pendingPinSetup || loading) {
      return;
    }

    setLoading(true);
    const setupGeneration = authGenerationRef.current;
    const { token: setupToken, user: setupUser, portal: setupPortal } = pendingPinSetup;
    try {
      const uid = deviceUid || (await getOrCreateDeviceUid());
      setDeviceUid(uid);

      await registerMobileDevice(setupToken, {
        deviceUid: uid,
        pin,
        deviceName: `Technaware-Mobile/${Platform.OS}`,
        platform: Platform.OS,
        biometricEnabled,
      });

      if (setupGeneration !== authGenerationRef.current) {
        return;
      }

      const registration: DeviceRegistration = {
        userId: setupUser.id,
        userName: setupUser.name || setupUser.username,
        username: setupUser.username,
        biometricEnabled,
      };
      await saveDeviceRegistration(registration);
      setDeviceRegistration(registration);

      if (biometricEnabled) {
        await saveDevicePinForBiometric(pin);
      } else {
        await clearDevicePinForBiometric();
      }

      setPendingPinSetup(null);
      await completeAuthentication(setupToken, setupUser, setupPortal);
      setAuthScreen('credential');
      showToast(`Welcome, ${registration.userName}. This device is now secured.`, 'success');
    } catch (error) {
      if (setupGeneration === authGenerationRef.current) {
        showToast(error instanceof Error ? error.message : 'Failed to register this device.', 'error');
      }
    } finally {
      if (setupGeneration === authGenerationRef.current) {
        setLoading(false);
      }
    }
  };

  const handlePinSetupCancel = async () => {
    const revokeToken = pendingPinSetup?.token ?? '';
    authGenerationRef.current += 1;
    setPendingPinSetup(null);
    await clearSignedInState(String(user?.id ?? ''));
    setAuthScreen('credential');
    setLoading(false);
    if (revokeToken) {
      void logout(revokeToken).catch(() => {
        /* best-effort */
      });
    }
  };

  const handlePinLogin = async (pin: string) => {
    if (loading) {
      return;
    }

    const registration = deviceRegistration ?? (await loadDeviceRegistration());
    if (!registration) {
      setAuthScreen('credential');
      showToast('This device is not registered. Sign in with your account first.', 'info');
      return;
    }

    setLoading(true);
    const loginGeneration = authGenerationRef.current;
    try {
      const uid = deviceUid || (await getOrCreateDeviceUid());
      setDeviceUid(uid);
      const res = await deviceLogin(uid, pin);
      if (loginGeneration !== authGenerationRef.current) {
        return;
      }

      await completeAuthentication(res.data.token, res.data.user, res.data.portal);
      setAuthScreen('credential');
      showToast(`Welcome back, ${res.data.user.name || res.data.user.username}.`, 'success');
    } catch (error) {
      if (loginGeneration === authGenerationRef.current) {
        showToast(error instanceof Error ? error.message : 'Incorrect PIN.', 'error');
      }
    } finally {
      if (loginGeneration === authGenerationRef.current) {
        setLoading(false);
      }
    }
  };

  const handleSwitchUser = async () => {
    authGenerationRef.current += 1;
    await clearDeviceRegistration();
    await clearSignedInState(String(user?.id ?? ''));
    setDeviceRegistration(null);
    setPendingPinSetup(null);
    setAuthScreen('credential');
    setLoading(false);
    showToast('Sign in with your username and password.', 'info');
  };

  const handleForgotPin = () => {
    void handleSwitchUser();
  };

  const handleApplyPortalBootstrap = useCallback((nextPortal: MobilePortalBootstrap) => {
    setPortal(nextPortal);
    if (user?.id != null) {
      void savePortalBootstrap(String(user.id), nextPortal);
    }
  }, [user?.id]);

  const handleRefreshProfile = useCallback(async (options?: RefreshProfileOptions) => {
    if (!token) {
      showToast('Please login first.', 'info');
      return;
    }

    const generation = authGenerationRef.current;
    const silent = options?.silent === true;
    if (!silent) {
      setLoading(true);
    }
    try {
      const res = await me(token);
      if (generation !== authGenerationRef.current) {
        return;
      }
      setUser(res.data.user);
      setPortal(res.data.portal ?? null);
      await persistAuthSession(token, JSON.stringify(res.data.user));
      if (res.data.portal) {
        await savePortalBootstrap(String(res.data.user.id), res.data.portal);
      }
      if (!silent) {
        showToast('Profile updated from server.', 'success');
      }
    } catch (error) {
      if (generation === authGenerationRef.current) {
        showToast(error instanceof Error ? error.message : 'Failed to refresh profile.', 'error');
      }
    } finally {
      if (!silent && generation === authGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [showToast, token]);

  const handleLogout = useCallback(async () => {
    if (!token) {
      showToast('No active session.', 'info');
      return;
    }

    authGenerationRef.current += 1;
    const revokeToken = token;
    const userId = String(user?.id ?? '');

    if (userId !== '') {
      await clearPortalBootstrap(userId);
    }
    await clearAuthSession();
    setToken('');
    setUser(null);
    setPortal(null);
    setPassword('');
    setLoading(false);
    setAuthScreen(deviceRegistration ? 'pin_login' : 'credential');
    showToast('Signed out successfully.', 'success');

    void logout(revokeToken).catch(() => {
      /* token already cleared locally; revoke is best-effort */
    });
  }, [deviceRegistration, showToast, token, user?.id]);

  if (hydrating || !fontsLoaded) {
    return null;
  }

  const renderAuthScreen = () => {
    if (authScreen === 'pin_login' && deviceRegistration) {
      return (
        <PinLoginScreen
          logoUri={logoUri}
          userName={deviceRegistration.userName}
          biometricEnabled={deviceRegistration.biometricEnabled}
          loading={loading}
          onSubmitPin={(pin) => void handlePinLogin(pin)}
          onForgotPin={() => void handleForgotPin()}
          onSwitchUser={() => void handleSwitchUser()}
        />
      );
    }

    if (authScreen === 'pin_setup' && pendingPinSetup) {
      return (
        <PinSetupScreen
          logoUri={logoUri}
          userName={pendingPinSetup.user.name || pendingPinSetup.user.username}
          loading={loading}
          onComplete={(pin, biometricEnabled) => void handlePinSetupComplete(pin, biometricEnabled)}
          onPinMismatch={() => showToast('PINs do not match. Try again.', 'error')}
          onCancel={() => void handlePinSetupCancel()}
        />
      );
    }

    return (
      <ScrollView
        style={styles.loginScroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.loginContainer}
        showsVerticalScrollIndicator={false}
      >
        <LoginScreen
          logoUri={logoUri}
          username={username}
          password={password}
          showPassword={showPassword}
          rememberMe={rememberMe}
          loading={loading}
          onChangeUsername={setUsername}
          onChangePassword={setPassword}
          onTogglePassword={() => setShowPassword((prev) => !prev)}
          onToggleRememberMe={() => setRememberMe((prev) => !prev)}
          onForgotPassword={() => showToast('Sign in with your username and password, then create a new PIN.', 'info')}
          onLogin={() => void handleCredentialLogin()}
        />
      </ScrollView>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: isAuthed ? colors.pageBg : authTheme.bg }}>
      {isAuthed ? <View style={{ height: insets.top, backgroundColor: statusBarBg }} /> : null}
      {Platform.OS === 'android' ? <RNStatusBar translucent backgroundColor="transparent" barStyle="light-content" /> : null}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: isAuthed ? colors.pageBg : authTheme.bg }}
      >
        <StatusBar style="light" />
        {!isAuthed ? (
          <SafeAreaView style={styles.safeLogin} edges={['top', 'bottom']}>
            {renderAuthScreen()}
          </SafeAreaView>
        ) : (
          <AppNavigator
            token={token}
            user={user}
            portal={portal}
            loading={loading}
            onRefreshProfile={handleRefreshProfile}
            onApplyPortalBootstrap={handleApplyPortalBootstrap}
            onLogout={handleLogout}
            onPortalNotify={(message, type) => showToast(message, type ?? 'info')}
          />
        )}
        <Toast visible={toastVisible} message={toastMessage} type={toastType} />
      </KeyboardAvoidingView>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NetworkStatusProvider>
        <AppContent />
      </NetworkStatusProvider>
    </SafeAreaProvider>
  );
}
