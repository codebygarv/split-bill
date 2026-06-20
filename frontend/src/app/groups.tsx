import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { Theme } from '../constants/theme';
import { Logo } from '../components/Logo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function GroupsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { setActiveGroup } = useGroup();

  const groups = user?.groups || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Logo size={40} />
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.greeting}>Hey, {user?.name}!</Text>
          <Text style={styles.subGreeting}>Select a group to start tracking expenses, or create a new one.</Text>
        </View>

        {/* Existing Groups List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Groups</Text>
          {groups.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>You aren't in any groups yet.</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {groups.map((group) => (
                <TouchableOpacity
                  key={group._id}
                  style={styles.groupCard}
                  onPress={() => setActiveGroup(group._id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{group.type}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Theme.colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/create-group')}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>Create a Group</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => router.push('/join-group')}
            activeOpacity={0.8}
          >
            <Text style={styles.joinButtonText}>Join with Group Code</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Theme.spacing.marginMobile,
    paddingVertical: Theme.spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: Theme.spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  logoutButton: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.rounded.md,
    backgroundColor: 'rgba(186, 26, 26, 0.1)',
  },
  logoutText: {
    color: Theme.colors.error,
    ...Theme.typography.labelSm,
  },
  greeting: {
    ...Theme.typography.headlineLg,
    color: Theme.colors.text,
  },
  subGreeting: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
  },
  section: {
    flex: 1,
    marginVertical: Theme.spacing.md,
  },
  sectionTitle: {
    ...Theme.typography.labelMd,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  emptyCard: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.xl,
    borderRadius: Theme.rounded.xl,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.textSecondary,
  },
  listContainer: {
    gap: Theme.spacing.sm,
  },
  groupCard: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.rounded.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Theme.shadows,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  groupName: {
    ...Theme.typography.headlineMd,
    fontSize: 18,
    color: Theme.colors.text,
  },
  badge: {
    backgroundColor: 'rgba(43, 168, 162, 0.1)',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.rounded.full,
  },
  badgeText: {
    color: Theme.colors.primaryDark,
    fontSize: 11,
    fontWeight: '600',
  },
  groupArrow: {
    fontSize: 20,
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  actionsContainer: {
    gap: Theme.spacing.md,
    marginTop: Theme.spacing.xl,
  },
  createButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.rounded.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows,
  },
  createButtonText: {
    color: Theme.colors.onPrimary,
    ...Theme.typography.labelMd,
    fontWeight: '700',
  },
  joinButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.rounded.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    color: Theme.colors.primaryDark,
    ...Theme.typography.labelMd,
    fontWeight: '700',
  },
});
