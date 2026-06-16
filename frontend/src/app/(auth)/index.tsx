import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity,  } from 'react-native';
import { useRouter } from 'expo-router';
import { Logo } from '../../components/Logo';
import { Theme } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        {/* Branding Area */}
        <View style={styles.brandContainer}>
          <Logo size={100} />
          <Text style={styles.title}>SplitBill</Text>
          <Text style={styles.subtitle}>
            Financial harmony in your social circle. Split expenses, clear debts, and track group spending instantly.
          </Text>
        </View>

        {/* Action Buttons Container */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/register')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Theme.spacing.marginMobile,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 100,
    width: '100%',
  },
  title: {
    ...Theme.typography.displayLg,
    color: Theme.colors.text,
    marginTop: Theme.spacing.md,
    letterSpacing: -0.8,
  },
  subtitle: {
    ...Theme.typography.bodyLg,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.sm,
    lineHeight: 26,
  },
  buttonContainer: {
    width: '100%',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.rounded.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows,
  },
  primaryButtonText: {
    color: Theme.colors.onPrimary,
    ...Theme.typography.labelMd,
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.rounded.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: Theme.colors.primaryDark,
    ...Theme.typography.labelMd,
    fontWeight: '700',
    fontSize: 16,
  },
  footerText: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
    opacity: 0.5,
  },
});
