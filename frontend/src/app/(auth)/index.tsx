import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Logo } from '../../components/Logo';
import { Theme } from '../../constants/theme';

import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Dynamic Aesthetic Ambient Glows */}
      <View style={[styles.glowBall, styles.glowTeal, { top: -80, right: -60, width: 280, height: 280 }]} />
      <View style={[styles.glowBall, styles.glowPurple, { top: 220, left: -120, width: 340, height: 340 }]} />
      <View style={[styles.glowBall, styles.glowOrange, { bottom: -100, right: -80, width: 300, height: 300 }]} />

      <View style={styles.content}>
        
        {/* Logo and Brand Container */}
        <View style={styles.brandContainer}>
          <View style={styles.logoOuterGlow}>
            <View style={styles.logoShadowWrapper}>
              <Logo size={110} />
            </View>
          </View>
          <Text style={styles.title}>SplitBill</Text>
          <Text style={styles.tagline}>Simplify your shared expenses</Text>
        </View>

        {/* Glassmorphic Panel for content & actions */}
        <View style={styles.glassPanel}>
          <Text style={styles.description}>
            Experience financial harmony. Seamlessly split bills, track group tabulations, and settle up with friends instantly.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={() => router.push('/register')}
              activeOpacity={0.9}
              style={styles.shadowButton}
            >
              <LinearGradient
                colors={['#2BA8A2', '#007A75']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
                <Ionicons name="arrow-forward-outline" size={18} color="#FFF" style={styles.buttonIcon} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>I already have an account</Text>
              <Ionicons name="log-in-outline" size={18} color={Theme.colors.primaryDark} style={styles.buttonIcon} />
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F7F5', // Soft, clean backdrop
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
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.marginMobile,
    paddingVertical: Theme.spacing.xl,
    zIndex: 10,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 60,
    width: '100%',
  },
  logoOuterGlow: {
    padding: 10,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  logoShadowWrapper: {
    shadowColor: '#006A66',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 10,
  },
  title: {
    ...Theme.typography.displayLg,
    color: '#0D2C2A',
    marginTop: Theme.spacing.md,
    letterSpacing: -1,
    fontSize: 42,
    fontWeight: '800',
  },
  tagline: {
    ...Theme.typography.labelMd,
    color: Theme.colors.primaryDark,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginTop: 4,
  },
  glassPanel: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: Theme.rounded.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#006A66',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 0,
    marginBottom: Theme.spacing.sm,
  },
  description: {
    ...Theme.typography.bodyMd,
    color: '#37474F',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Theme.spacing.lg,
  },
  buttonContainer: {
    width: '100%',
    gap: Theme.spacing.md,
  },
  shadowButton: {
    shadowColor: '#2BA8A2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryButton: {
    height: 52,
    borderRadius: Theme.rounded.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 52,
    borderRadius: Theme.rounded.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(43, 168, 162, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: Theme.colors.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});
