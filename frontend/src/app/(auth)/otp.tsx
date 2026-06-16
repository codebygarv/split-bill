import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Theme } from '../../constants/theme';
import { Logo } from '../../components/Logo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function OTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { verifyOtp, resendOtp } = useAuth();

  const email = typeof params.email === 'string' ? params.email : '';

  const [otp, setOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hidden input focus tracking
  const [isFocused, setIsFocused] = useState(false);
  const otpRef = useRef<TextInput>(null);

  // Countdown timer for Resend Code
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timer === 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    if (!otp || otp.length < 6) {
      setErrorMsg('Please enter a valid 6-digit code');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      await verifyOtp(email, otp);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed');
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await resendOtp(email);
      setSuccessMsg('A new code has been sent to your email.');
      setTimer(30);
      setCanResend(false);
      setOtp(''); // Clear previous OTP
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend code');
    }
  };

  const focusOtpInput = () => {
    otpRef.current?.focus();
  };

  const pinCells = Array(6).fill('');

  return (
    <View style={styles.container}>
      {/* Dynamic Aesthetic Ambient Glows */}
      <View style={[styles.glowBall, styles.glowTeal, { top: -80, right: -60, width: 280, height: 280 }]} />
      <View style={[styles.glowBall, styles.glowPurple, { top: 220, left: -120, width: 340, height: 340 }]} />
      <View style={[styles.glowBall, styles.glowOrange, { bottom: -100, right: -80, width: 300, height: 300 }]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <View style={styles.logoOuterGlow}>
              <View style={styles.logoShadowWrapper}>
                <Logo size={60} />
              </View>
            </View>
            <Text style={styles.title}>Verify Email</Text>
            <Text style={styles.subtitle}>We sent a code to {email || 'your email'}</Text>
          </View>

          <View style={styles.form}>
            {errorMsg && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color={Theme.colors.error} style={styles.errorIcon} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}
            {successMsg && (
              <View style={[styles.errorBanner, { backgroundColor: Theme.colors.successBg }]}>
                <Ionicons name="checkmark-circle" size={20} color={Theme.colors.success} style={styles.errorIcon} />
                <Text style={[styles.errorText, { color: Theme.colors.success }]}>{successMsg}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>6-Digit Verification Code</Text>

              {/* Custom 6-cell visual display */}
              <TouchableOpacity
                style={styles.otpBoxesContainer}
                activeOpacity={1}
                onPress={focusOtpInput}
              >
                {pinCells.map((_, index) => {
                  const char = otp[index] || '';
                  const isCurrentFocused = isFocused && (index === otp.length || (index === 5 && otp.length === 6));
                  return (
                    <View
                      key={index}
                      style={[
                        styles.otpCell,
                        char ? styles.otpCellFilled : null,
                        isCurrentFocused ? styles.otpCellFocused : null
                      ]}
                    >
                      <Text style={styles.otpCellText}>{char}</Text>
                    </View>
                  );
                })}
              </TouchableOpacity>

              {/* Real hidden TextInput */}
              <TextInput
                ref={otpRef}
                style={styles.hiddenInput}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(val) => {
                  const cleaned = val.replace(/[^0-9]/g, '');
                  setOtp(cleaned);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={styles.shadowButton}
              onPress={handleVerify}
              disabled={isSubmitting}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#2BA8A2', '#007A75']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.button, isSubmitting && styles.buttonDisabled]}
              >
                <View style={styles.buttonInner}>
                  <Text style={styles.buttonText}>
                    {isSubmitting ? 'Verifying...' : 'Verify'}
                  </Text>
                  {!isSubmitting && <Ionicons name="shield-checkmark-outline" size={18} color="#FFF" style={{ marginLeft: 6 }} />}
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.registerLinkContainer}>
              <Text style={styles.registerText}>Didn't receive the code? </Text>
              {canResend ? (
                <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                  <Text style={styles.registerLink}>Resend</Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.registerLink, { color: Theme.colors.textSecondary, opacity: 0.6 }]}>
                  Resend in {timer}s
                </Text>
              )}
            </View>

            <View style={[styles.registerLinkContainer, { marginTop: Theme.spacing.xs }]}>
              <TouchableOpacity onPress={() => router.replace('/login')} activeOpacity={0.7}>
                <View style={styles.backToLoginInner}>
                  <Ionicons name="chevron-back" size={16} color={Theme.colors.textSecondary} />
                  <Text style={[styles.registerLink, { color: Theme.colors.textSecondary, marginLeft: 2 }]}>Back to Login</Text>
                </View>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    elevation: 6,
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
    marginBottom: Theme.spacing.lg,
    alignItems: 'center',
  },
  label: {
    ...Theme.typography.labelMd,
    color: '#37474F',
    marginBottom: Theme.spacing.sm,
    fontWeight: '700',
    alignSelf: 'flex-start',
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: Theme.spacing.xs - 4,
  },
  otpCell: {
    width: 42,
    height: 52,
    borderWidth: 1.5,
    borderColor: 'rgba(229, 231, 235, 0.8)',
    borderRadius: Theme.rounded.md,
    backgroundColor: 'rgba(249, 250, 251, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpCellFilled: {
    borderColor: 'rgba(229, 231, 235, 0.8)',
    backgroundColor: '#FFFFFF',
  },
  otpCellFocused: {
    borderColor: Theme.colors.primary,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  otpCellText: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
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
    width: '100%',
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
  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Theme.spacing.md,
  },
  backToLoginInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
