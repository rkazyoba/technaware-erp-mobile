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
import { API_BASE_URL, ApiRequestError, login, logout, me, setSessionInvalidHandler } from './src/api';
import { Toast, ToastType } from './src/components/Toast';
import { colors } from './src/constants/colors';
import { AppNavigator } from './src/navigation/AppNavigator';
import { NetworkStatusProvider } from './src/context/NetworkStatusContext';
import { LoginScreen } from './src/screens/LoginScreen';
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

SplashScreen.preventAutoHideAsync().catch(() => {
  /* Dev fast-refresh may hide splash before preventAutoHideAsync runs. */
});

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
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Bumped on logout so in-flight /me responses cannot restore the session. */
  const authGenerationRef = useRef(0);
  /** Mirrors `token` for 401 handling so stale `/me` cannot clear a fresh login. */
  const activeTokenRef = useRef('');

  const isAuthed = useMemo(() => token.length > 0, [token]);
  const appBaseUrl = API_BASE_URL.replace('/api/v1', '');
  const logoUri = `${appBaseUrl}/backend/assets/img/logo.png`;
  const statusBarBg = isAuthed ? colors.primaryNavy : '#031336';

  useEffect(() => {
    activeTokenRef.current = token;
  }, [token]);

  const showToast = (message: string, type: ToastType = 'info') => {
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
  };

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

  useEffect(() => {
    let cancelled = false;

    setSessionInvalidHandler((failedToken) => {
      if (failedToken !== activeTokenRef.current) {
        return;
      }
      authGenerationRef.current += 1;
      void clearAuthSession();
      setToken('');
      setUser(null);
      setPortal(null);
      setLoading(false);
      setToastMessage('Session expired. Please sign in again.');
      setToastType('info');
      setToastVisible(true);
    });

    (async () => {
      try {
        const [session, rememberedUsername] = await Promise.all([loadAuthSession(), loadRememberedUsername()]);
        if (cancelled) {
          return;
        }

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
            }
          } catch (err: unknown) {
            if (!cancelled && err instanceof ApiRequestError && (err.httpStatus === 401 || err.httpStatus === 403)) {
              authGenerationRef.current += 1;
              if (cachedUserId !== '') {
                await clearPortalBootstrap(cachedUserId);
              }
              await clearAuthSession();
              setToken('');
              setUser(null);
              setPortal(null);
            }
            /* Network errors: keep cached user + portal so the shell loads offline. */
          }
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
  }, []);

  const handleLogin = async () => {
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

      authGenerationRef.current += 1;
      const nextToken = res.data.token;
      activeTokenRef.current = nextToken;
      setToken(nextToken);
      setUser(res.data.user);
      setPortal(res.data.portal ?? null);
      await persistAuthSession(nextToken, JSON.stringify(res.data.user));
      if (res.data.portal) {
        await savePortalBootstrap(String(res.data.user.id), res.data.portal);
      }
      if (rememberMe) {
        await saveRememberedUsername(trimmedUsername);
      } else {
        await clearRememberedUsername();
      }
      setPassword('');
      showToast(`Welcome back, ${res.data.user.name || res.data.user.username}.`, 'success');
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
  }, [token]);

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
    showToast('Signed out successfully.', 'success');

    void logout(revokeToken).catch(() => {
      /* token already cleared locally; revoke is best-effort */
    });
  }, [token, user?.id]);

  if (hydrating || !fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: isAuthed ? colors.pageBg : '#031336' }}>
      {isAuthed ? <View style={{ height: insets.top, backgroundColor: statusBarBg }} /> : null}
      {Platform.OS === 'android' ? <RNStatusBar translucent backgroundColor="transparent" barStyle="light-content" /> : null}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <StatusBar style="light" />
        {!isAuthed ? (
          <SafeAreaView style={styles.safeLogin} edges={['top', 'bottom']}>
            <ScrollView
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
                onForgotPassword={() => showToast('Forgot password flow will be added next.', 'info')}
                onLogin={handleLogin}
              />
            </ScrollView>
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
