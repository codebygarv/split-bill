import React, { useState } from 'react';
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

export default function OTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { verifyOtp, resendOtp } = useAuth();
  
  const email = typeof params.email === 'string' ? params.email : '';
  
  const [otp, setOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // NavigationGuard handles redirect on successful user load
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
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend code');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <Logo size={60} />
            <Text style={styles.title}>Verify Email</Text>
            <Text style={styles.subtitle}>We sent a code to {email || 'your email'}</Text>
          </View>

          <View style={styles.form}>
            {errorMsg && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}
            {successMsg && (
              <View style={[styles.errorBanner, { backgroundColor: Theme.colors.successBg }]}>
                <Text style={[styles.errorText, { color: Theme.colors.success }]}>{successMsg}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>6-Digit Code</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit code"
                placeholderTextColor={Theme.colors.textSecondary}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? 'Verifying...' : 'Verify'}
              </Text>
            </TouchableOpacity>

            <View style={styles.registerLinkContainer}>
              <Text style={styles.registerText}>Didn't receive the code? </Text>
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.registerLink}>Resend</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.registerLinkContainer}>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={styles.registerLink}>Back to Login</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Theme.spacing.marginMobile,
    justifyContent: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  title: {
    ...Theme.typography.headlineLg,
    color: Theme.colors.text,
    marginTop: Theme.spacing.md,
  },
  subtitle: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: Theme.spacing.xs,
  },
  form: {
    width: '100%',
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.lg,
    borderRadius: Theme.rounded.xl,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows,
  },
  errorBanner: {
    backgroundColor: Theme.colors.errorBg,
    padding: Theme.spacing.md,
    borderRadius: Theme.rounded.md,
    marginBottom: Theme.spacing.md,
  },
  errorText: {
    color: Theme.colors.error,
    ...Theme.typography.labelMd,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: Theme.spacing.lg,
  },
  label: {
    ...Theme.typography.labelMd,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.rounded.md,
    paddingHorizontal: Theme.spacing.md,
    color: Theme.colors.text,
    ...Theme.typography.bodyMd,
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 4,
  },
  button: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.rounded.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Theme.colors.onPrimary,
    ...Theme.typography.labelMd,
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
