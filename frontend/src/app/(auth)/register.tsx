import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Theme } from '../../constants/theme';
import { Logo } from '../../components/Logo';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';


const USE_CASES = ['Family', 'Roommates', 'Friends', 'Trip', 'Office Team', 'Other'];

const USE_CASE_ICONS: Record<string, any> = {
  Family: 'home-outline',
  Roommates: 'people-outline',
  Friends: 'beer-outline',
  Trip: 'airplane-outline',
  'Office Team': 'briefcase-outline',
  Other: 'grid-outline',
};

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

  // Interactive Focus States
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Password Visibility Toggle
  const [showPassword, setShowPassword] = useState(false);

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
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Aesthetic Ambient Glows */}
      <View style={[styles.glowBall, styles.glowTeal, { top: -80, right: -60, width: 280, height: 280 }]} />
      <View style={[styles.glowBall, styles.glowPurple, { top: 220, left: -120, width: 340, height: 340 }]} />
      <View style={[styles.glowBall, styles.glowOrange, { bottom: -100, right: -80, width: 300, height: 300 }]} />

      <KeyboardAvoidingView
        behavior={undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoOuterGlow}>
              <View style={styles.logoShadowWrapper}>
                <Logo size={50} />
              </View>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start tracking expenses easily with your groups</Text>
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
              <Text style={styles.label}>Full Name</Text>
              <View style={[
                styles.inputWrapper, 
                nameFocused && styles.inputWrapperFocused
              ]}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={nameFocused ? Theme.colors.primary : Theme.colors.textSecondary} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor={Theme.colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                />
              </View>
            </View>

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
              <Text style={styles.label}>Phone Number (Optional)</Text>
              <View style={[
                styles.inputWrapper, 
                phoneFocused && styles.inputWrapperFocused
              ]}>
                <Ionicons 
                  name="call-outline" 
                  size={20} 
                  color={phoneFocused ? Theme.colors.primary : Theme.colors.textSecondary} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number"
                  placeholderTextColor={Theme.colors.textSecondary}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => setPhoneFocused(false)}
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
                  placeholder="Choose a password"
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

            {/* Onboarding grid selection panel */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>How will you use SplitBill?</Text>
              <View style={styles.gridContainer}>
                {USE_CASES.map((uc) => {
                  const isSelected = useCase === uc;
                  const iconName = USE_CASE_ICONS[uc];
                  return (
                    <TouchableOpacity
                      key={uc}
                      style={[
                        styles.gridCard,
                        isSelected && styles.gridCardSelected
                      ]}
                      onPress={() => setUseCase(uc)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.gridCardIconBg, isSelected && styles.gridCardIconBgSelected]}>
                        <Ionicons 
                          name={iconName} 
                          size={20} 
                          color={isSelected ? Theme.colors.primaryDark : Theme.colors.textSecondary} 
                        />
                      </View>
                      <Text style={[styles.gridCardText, isSelected && styles.gridCardTextSelected]}>
                        {uc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={styles.shadowButton}
              onPress={handleRegister}
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
                    {isSubmitting ? 'Creating Account...' : 'Sign Up'}
                  </Text>
                  {!isSubmitting && <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" style={{ marginLeft: 6 }} />}
                </View>
              </LinearGradient>
            </TouchableOpacity>


            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')} activeOpacity={0.7}>
                <Text style={styles.loginLink}>Log In</Text>
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
    paddingVertical: Theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginVertical: Theme.spacing.md,
  },
  logoOuterGlow: {
    padding: 8,
    borderRadius: 20,
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: Theme.spacing.xs - 4,
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: 'rgba(249, 250, 251, 0.6)',
    borderRadius: Theme.rounded.md,
    borderWidth: 1.5,
    borderColor: 'rgba(229, 231, 235, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  gridCardSelected: {
    backgroundColor: 'rgba(43, 168, 162, 0.08)',
    borderColor: Theme.colors.primary,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 0,
  },
  gridCardIconBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  gridCardIconBgSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  gridCardText: {
    fontSize: 10,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  gridCardTextSelected: {
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
