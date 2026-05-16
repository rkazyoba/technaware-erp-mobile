import { useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { styles } from '../styles/appStyles';

type LoginScreenProps = {
  logoUri: string;
  username: string;
  password: string;
  showPassword: boolean;
  rememberMe: boolean;
  loading: boolean;
  onChangeUsername: (value: string) => void;
  onChangePassword: (value: string) => void;
  onTogglePassword: () => void;
  onToggleRememberMe: () => void;
  onForgotPassword: () => void;
  onLogin: () => void;
};

export function LoginScreen({
  logoUri,
  username,
  password,
  showPassword,
  rememberMe,
  loading,
  onChangeUsername,
  onChangePassword,
  onTogglePassword,
  onToggleRememberMe,
  onForgotPassword,
  onLogin,
}: LoginScreenProps) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <View style={styles.loginShell}>
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
        <Text style={styles.loginTitle}>Welcome back</Text>
        <Text style={styles.loginSubtitle}>Sign in to continue</Text>
      </View>

      <View style={styles.loginCard}>
        <Text style={styles.inputLabel}>USERNAME</Text>
        <TextInput
          style={styles.loginInput}
          placeholder="Username"
          placeholderTextColor="#96a2b8"
          autoCapitalize="none"
          value={username}
          onChangeText={onChangeUsername}
        />
        <Text style={styles.inputLabel}>PASSWORD</Text>
        <View style={styles.passwordWrap}>
            <TextInput
                style={styles.loginInputPassword}
                placeholder="Password"
                placeholderTextColor="#96a2b8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={onChangePassword}
                returnKeyType="go"
                onSubmitEditing={() => {
                  if (!loading) {
                    onLogin();
                  }
                }}
              />
          <Pressable style={styles.eyeButton} onPress={onTogglePassword} accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
            <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
          </Pressable>
        </View>

        <View style={styles.loginMetaRow}>
          <Pressable style={styles.rememberWrap} onPress={onToggleRememberMe}>
            <View style={[styles.checkbox, rememberMe ? styles.checkboxActive : null]}>
              {rememberMe ? <Text style={styles.checkboxTick}>✓</Text> : null}
            </View>
            <Text style={styles.rememberText}>Remember me</Text>
          </Pressable>

          <Pressable onPress={onForgotPassword}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
        </View>

        <Pressable style={[styles.loginButton, loading ? styles.disabled : null]} onPress={onLogin} disabled={loading}>
          <Text style={styles.loginButtonText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
        </Pressable>
      </View>

      <Text style={styles.footerText}>Powered by Technaware Solutions.</Text>
      <Text style={styles.footerText}>© {new Date().getFullYear()}</Text>
    </View>
  );
}
