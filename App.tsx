import { StatusBar } from 'expo-status-bar';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  useFonts,
} from '@expo-google-fonts/outfit';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL, login, logout, me } from './src/api';
import { Toast, ToastType } from './src/components/Toast';
import { LoginScreen } from './src/screens/LoginScreen';
import { MainAppScreen } from './src/screens/MainAppScreen';
import { styles } from './src/styles/appStyles';
import { AppTab, SignedInUser } from './src/types/app';

export default function App() {
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
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [selectedModule, setSelectedModule] = useState<string>('Approvals');
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('info');
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAuthed = useMemo(() => token.length > 0, [token]);
  const appBaseUrl = API_BASE_URL.replace('/api/v1', '');
  const logoUri = `${appBaseUrl}/backend/assets/img/logo.png`;
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

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await login(username, password);
      setToken(res.data.token);
      setUser(res.data.user);
      setActiveTab('dashboard');
      showToast(`Welcome back, ${res.data.user.name || res.data.user.username}.`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Login failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshProfile = async () => {
    if (!token) {
      showToast('Please login first.', 'info');
      return;
    }

    setLoading(true);
    try {
      const res = await me(token);
      setUser(res.data.user);
      showToast('Profile updated from server.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to refresh profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!token) {
      showToast('No active session.', 'info');
      return;
    }

    setLoading(true);
    try {
      await logout(token);
      setToken('');
      setUser(null);
      setUsername('');
      setPassword('');
      showToast('Signed out successfully.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Logout failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAction = (title: string) => {
    setSelectedModule(title === 'Add Leave Request' ? 'Leave Requests' : title);
    setActiveTab('modules');
  };

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.safe}>
          <ActivityIndicator size="large" color="#00c8ff" />
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[styles.safe, { backgroundColor: isAuthed ? '#07204a' : '#031336' }]}
        edges={['top']}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.safe}>
          <StatusBar
            style="light"
            backgroundColor={isAuthed ? '#07204a' : '#031336'}
            translucent={false}
          />
          {!isAuthed ? (
            <ScrollView contentContainerStyle={styles.loginContainer}>
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
          ) : (
            <MainAppScreen
              token={token}
              user={user}
              activeTab={activeTab}
              selectedModule={selectedModule}
              loading={loading}
              onSetTab={setActiveTab}
              onRefreshProfile={handleRefreshProfile}
              onLogout={handleLogout}
              onOpenAction={openAction}
            />
          )}
          <Toast visible={toastVisible} message={toastMessage} type={toastType} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
