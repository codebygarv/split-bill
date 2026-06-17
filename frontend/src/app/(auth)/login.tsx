import React, { useState, useTransition } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Theme } from '../../constants/theme';
import { Logo } from '../../components/Logo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Interactive Focus States
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Password Visibility Toggle
  const [showPassword, setShowPassword] = useState(false);

  // Remember Me checkbox
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      setErrorMsg('Please enter both Email and Password');
      return;
    }

    setErrorMsg(null);

    startTransition(async () => {
      try {
        const result = await login(email, password);
        if (result && result.requiresOtp) {
          router.push({ pathname: '/otp', params: { email: result.email || email } });
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Login failed');
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Aesthetic Ambient Glows */}
      <View style={[styles.glowBall, styles.glowTeal, { top: -80, right: -60, width: 280, height: 280 }]} />
      <View style={[styles.glowBall, styles.glowPurple, { top: 220, left: -120, width: 340, height: 340 }]} />
      <View style={[styles.glowBall, styles.glowOrange, { bottom: -100, right: -80, width: 300, height: 300 }]} />

      <KeyboardAwareScrollView
        style={styles.keyboardView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={120}
      >

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoOuterGlow}>
            <View style={styles.logoShadowWrapper}>
              <Logo size={60} />
            </View>
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Log in to check balances and add group bills</Text>
        </View>

        {/* Glassmorphic Form Card */}
        <View style={styles.form}>
          {errorMsg && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color={Theme.colors.error} style={styles.errorIcon} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={[
              styles.inputWrapper,
              emailFocused && styles.inputWrapperFocused
            ]}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={emailFocused ? Theme.colors.primary : Theme.colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                placeholderTextColor={Theme.colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={[
              styles.inputWrapper,
              passwordFocused && styles.inputWrapperFocused
            ]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={passwordFocused ? Theme.colors.primary : Theme.colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={Theme.colors.textSecondary}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={Theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me & Forgot Password Row */}
          {/* <View style={styles.rememberRow}>
              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Ionicons name="checkmark" size={12} color="#FFF" />}
                </View>
                <Text style={styles.checkboxLabel}>Remember me</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => setErrorMsg('Password reset instructions will be sent to your email.')} activeOpacity={0.7}>
                <Text style={styles.forgotPasswordLink}>Forgot?</Text>
              </TouchableOpacity>
            </View> */}

          {/* Actions */}
          <TouchableOpacity
            style={styles.shadowButton}
            onPress={handleLogin}
            disabled={isPending}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#2BA8A2', '#007A75']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.button, isPending && styles.buttonDisabled]}
            >
              <View style={styles.buttonInner}>
                <Text style={styles.buttonText}>
                  {isPending ? 'Logging In...' : 'Log In'}
                </Text>
                {!isPending && <Ionicons name="log-in-outline" size={18} color="#FFF" style={{ marginLeft: 6 }} />}
              </View>
            </LinearGradient>
          </TouchableOpacity>


          <View style={styles.registerLinkContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/register')} activeOpacity={0.7}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F7F5',
    position: 'relative',
    overflow: 'hidden',
  },
  glowBall: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.12,
  },
  glowTeal: {
    backgroundColor: '#2BA8A2',
  },
  glowPurple: {
    backgroundColor: '#9C27B0',
  },
  glowOrange: {
    backgroundColor: '#FF9800',
  },
  keyboardView: {
    flex: 1,
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Theme.spacing.marginMobile,
    justifyContent: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  logoOuterGlow: {
    padding: 8,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  logoShadowWrapper: {
    shadowColor: '#006A66',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    ...Theme.typography.headlineLg,
    color: '#0D2C2A',
    fontSize: 26,
    fontWeight: '800',
    marginTop: Theme.spacing.sm,
  },
  subtitle: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: Theme.spacing.xs - 4,
  },
  form: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: Theme.rounded.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#006A66',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 0,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.errorBg,
    padding: Theme.spacing.md,
    borderRadius: Theme.rounded.md,
    marginBottom: Theme.spacing.md,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    color: Theme.colors.error,
    ...Theme.typography.labelMd,
    flex: 1,
  },
  inputGroup: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    ...Theme.typography.labelMd,
    color: '#37474F',
    marginBottom: Theme.spacing.xs - 2,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(229, 231, 235, 0.7)',
    borderRadius: Theme.rounded.lg,
    paddingHorizontal: Theme.spacing.md,
    backgroundColor: '#FFFFFF',
  },
  inputWrapperFocused: {
    borderColor: Theme.colors.primary,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    color: Theme.colors.text,
    ...Theme.typography.bodyMd,
  },
  eyeButton: {
    padding: 6,
  },
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
    paddingHorizontal: 2,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: Theme.colors.primary,
  },
  checkboxLabel: {
    ...Theme.typography.labelSm,
    color: '#37474F',
    fontWeight: '600',
  },
  forgotPasswordLink: {
    ...Theme.typography.labelSm,
    color: Theme.colors.primaryDark,
    fontWeight: '700',
  },
  shadowButton: {
    shadowColor: '#2BA8A2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  button: {
    height: 52,
    borderRadius: Theme.rounded.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    ...Theme.typography.labelMd,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Theme.spacing.lg - 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(229, 231, 235, 0.8)',
  },
  dividerText: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
    marginHorizontal: Theme.spacing.md,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderWidth: 1.5,
    borderColor: 'rgba(229, 231, 235, 0.7)',
    borderRadius: Theme.rounded.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    gap: 8,
  },
  socialButtonText: {
    ...Theme.typography.labelSm,
    color: '#37474F',
    fontWeight: '700',
  },
  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Theme.spacing.md,
  },
  registerText: {
    ...Theme.typography.labelMd,
    color: Theme.colors.textSecondary,
  },
  registerLink: {
    ...Theme.typography.labelMd,
    color: Theme.colors.primaryDark,
    fontWeight: '700',
  },
});
