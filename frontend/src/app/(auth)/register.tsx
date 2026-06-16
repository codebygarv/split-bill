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
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Theme } from '../../constants/theme';
import { Logo } from '../../components/Logo';

const USE_CASES = ['Family', 'Roommates', 'Friends', 'Trip', 'Office Team', 'Other'];

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [useCase, setUseCase] = useState('Other');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setErrorMsg('Please fill in Name, Email, and Password');
      return;
    }
    
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const result = await register(name, email, password, phone, useCase);
      if (result && result.requiresOtp) {
        router.push({ pathname: '/otp', params: { email: result.email || email } });
      }
      // NavigationGuard handles redirect for successful login
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Header */}
          <View style={styles.header}>
            <Logo size={50} />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start tracking expenses easily with your groups</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {errorMsg && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={Theme.colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                placeholderTextColor={Theme.colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor={Theme.colors.textSecondary}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Choose a password"
                placeholderTextColor={Theme.colors.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Use Case Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>How will you use SplitBill?</Text>
              <View style={styles.chipsContainer}>
                {USE_CASES.map((uc) => {
                  const isSelected = useCase === uc;
                  return (
                    <TouchableOpacity
                      key={uc}
                      style={[
                        styles.chip,
                        isSelected && styles.chipSelected,
                      ]}
                      onPress={() => setUseCase(uc)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {uc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? 'Creating Account...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.loginLink}>Log In</Text>
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
    paddingVertical: Theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginVertical: Theme.spacing.lg,
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
    marginBottom: Theme.spacing.md,
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
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.xs,
    marginTop: Theme.spacing.xs,
  },
  chip: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.rounded.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: 'rgba(43, 168, 162, 0.1)',
    borderColor: Theme.colors.primary,
  },
  chipText: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
  },
  chipTextSelected: {
    color: Theme.colors.primaryDark,
  },
  button: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.rounded.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Theme.spacing.sm,
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
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Theme.spacing.md,
  },
  loginText: {
    ...Theme.typography.labelMd,
    color: Theme.colors.textSecondary,
  },
  loginLink: {
    ...Theme.typography.labelMd,
    color: Theme.colors.primaryDark,
    fontWeight: '700',
  },
});
