import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { GroupProvider, useGroup } from '../context/GroupContext';
import { ActivityIndicator, View, StyleSheet, Text, Animated } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../constants/theme';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Logo } from '../components/Logo';

const queryClient = new QueryClient();

// Dynamically setup notification handler to prevent Expo Go SDK 53+ crash
try {
  const isExpoGo = Constants.appOwnership === 'expo';
  if (!isExpoGo) {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (e) {
  console.log('Failed to setup notifications handler:', e);
}


function SplashScreen() {
  return (
    <View style={styles.splashContainer}>
      <View style={styles.splashContent}>
        {/* Simple Brand Container */}
        <View style={styles.brandContainer}>
          <Logo size={70} />
          <Text style={styles.splashTitle}>SplitBill</Text>
          <Text style={styles.splashTagline}>Simplify your shared expenses</Text>
        </View>

        {/* Loading indicator */}
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={Theme.colors.primary} />
        </View>
      </View>
    </View>
  );
}

function NavigationGuard() {
  const { user, loading: authLoading } = useAuth();
  const { activeGroupId } = useGroup();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (authLoading) return;

    // Determine current section based on segments
    const firstSegment = segments[0];

    // Auth routes are in the (auth) group
    const inAuthGroup = firstSegment === '(auth)';

    // Group selection routes: groups, create-group, join-group
    const inGroupGroup = firstSegment === 'groups' || firstSegment === 'create-group' || firstSegment === 'join-group';

    if (!user) {
      // Redirect unauthenticated user to welcome screen if they navigate out
      if (!inAuthGroup) {
        router.replace('/(auth)');
      }
    } else if (!activeGroupId) {
      // Redirect logged-in user without active group to /groups
      if (!inGroupGroup) {
        router.replace('/groups');
      }
    } else {
      // Redirect logged-in user with active group to dashboard if on auth/group creation pages
      if (inAuthGroup || inGroupGroup) {
        router.replace('/(tabs)/dashboard');
      }
    }
  }, [user, activeGroupId, authLoading, segments]);

  if (authLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Theme.colors.background } }} >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      
      <Stack.Screen name="groups" />
      <Stack.Screen name="create-group" />
      <Stack.Screen name="join-group" />

      <Stack.Screen name="add-expense" />
      <Stack.Screen name="settle-up" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: Theme.colors.background }}>
        <StatusBar style="dark" />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <GroupProvider>
              <NavigationGuard />
            </GroupProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F2F6F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  splashTitle: {
    color: '#0D2C2A',
    marginTop: 12,
    fontSize: 22,
    fontWeight: '700',
  },
  splashTagline: {
    color: Theme.colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
    fontSize: 11,
    marginTop: 4,
  },
  loaderContainer: {
    marginTop: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
