import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGroup } from '../../context/GroupContext';
import { Theme } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const CATEGORY_ICONS: Record<string, { name: any; color: string; bg: string }> = {
  Vegetables: { name: 'leaf', color: '#4CAF50', bg: '#E8F5E9' },
  Grocery: { name: 'cart', color: '#FF9800', bg: '#FFF3E0' },
  Rent: { name: 'home', color: '#9C27B0', bg: '#F3E5F5' },
  Electricity: { name: 'flash', color: '#FBC02D', bg: '#FFFDE7' },
  Water: { name: 'water', color: '#2196F3', bg: '#E3F2FD' },
  Internet: { name: 'wifi', color: '#00BCD4', bg: '#E0F7FA' },
  Transport: { name: 'car', color: '#607D8B', bg: '#ECEFF1' },
  Entertainment: { name: 'film', color: '#F44336', bg: '#FFEBEE' },
  Other: { name: 'document-text', color: '#9E9E9E', bg: '#F5F5F5' },
};

export default function DashboardScreen() {
  const router = useRouter();
  const { activeGroupData, loading, fetchDashboard, setActiveGroup } = useGroup();

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !activeGroupData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  const group = activeGroupData?.group;
  const summary = activeGroupData?.summary;
  const balances = activeGroupData?.balances;
  const recentExpenses = activeGroupData?.recentExpenses || [];

  const handleShareGroupCode = async () => {
    if (!group) return;
    try {
      await Share.share({
        message: `Join my expense group "${group.name}" on SplitBill using the code: ${group.code}`,
      });
    } catch (error) {
      console.log('Error sharing code:', error);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* App Bar */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{group?.name?.charAt(0)?.toUpperCase() || 'G'}</Text>
          </View>
          <View>
            <Text style={styles.greetingText}>Welcome to</Text>
            <Text style={styles.groupName}>{group?.name || 'Your Group'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.switchIconButton} onPress={() => setActiveGroup(null)}>
          <Ionicons name="swap-horizontal" size={24} color={Theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Main Overview Card */}
        <LinearGradient
          colors={[Theme.colors.primary, Theme.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.overviewCard}
        >
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewTitle}>Total Group Expenses</Text>
            <TouchableOpacity onPress={handleShareGroupCode} style={styles.shareBadge}>
              <Ionicons name="share-social" size={14} color={Theme.colors.primaryDark} />
              <Text style={styles.shareBadgeText}>Code: {group?.code}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.overviewAmount}>{formatCurrency(summary?.totalExpenses || 0)}</Text>

          <View style={styles.overviewDivider} />

          <View style={styles.overviewFooter}>
            <View>
              <Text style={styles.overviewSubTitle}>This Month</Text>
              <Text style={styles.overviewSubAmount}>{formatCurrency(summary?.thisMonthExpenses || 0)}</Text>
            </View>
            <View style={styles.overviewFooterRight}>
              <Text style={styles.overviewSubTitle}>Your Balance</Text>
              <Text style={[
                styles.overviewSubAmount,
                balances?.youOwe ? styles.textErrorLight : (balances?.youAreOwed ? styles.textSuccessLight : null)
              ]}>
                {balances?.youOwe ? `You owe ${formatCurrency(balances.youOwe)}` : (balances?.youAreOwed ? `Owed to you ${formatCurrency(balances.youAreOwed)}` : 'Settled up 🎉')}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/settle-up')}>
            <View style={[styles.actionIconBg, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="cash-outline" size={24} color="#1976D2" />
            </View>
            <Text style={styles.actionLabel}>Settle</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/members')}>
            <View style={[styles.actionIconBg, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="people-outline" size={24} color="#7B1FA2" />
            </View>
            <Text style={styles.actionLabel}>Members</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/notifications')}>
            <View style={[styles.actionIconBg, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="notifications-outline" size={24} color="#F57C00" />
            </View>
            <Text style={styles.actionLabel}>Activity</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/profile')}>
            <View style={[styles.actionIconBg, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="person-outline" size={24} color="#388E3C" />
            </View>
            <Text style={styles.actionLabel}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Expenses Feed */}
        <View style={styles.expensesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={fetchDashboard} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={20} color={Theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {recentExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIconBadge}>
                <Ionicons name="receipt-outline" size={32} color={Theme.colors.textSecondary} />
              </View>
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>Tap the + button to add the first expense.</Text>
            </View>
          ) : (
            <View style={styles.expensesList}>
              {recentExpenses.map((item: any, index: number) => {
                const iconDef = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.Other;
                const isLast = index === recentExpenses.length - 1;
                return (
                  <View key={item._id} style={[styles.expenseItem, !isLast && styles.expenseItemBorder]}>
                    <View style={styles.expenseLeft}>
                      <View style={[styles.categoryIconBg, { backgroundColor: iconDef.bg }]}>
                        <Ionicons name={iconDef.name} size={20} color={iconDef.color} />
                      </View>
                      <View style={styles.expenseInfo}>
                        <Text style={styles.expenseCategory}>{item.category}</Text>
                        <Text style={styles.expenseMeta} numberOfLines={1}>
                          Paid by <Text style={{ fontWeight: '600', color: Theme.colors.text }}>{item.paidBy?.name}</Text>
                          {item.notes ? ` • ${item.notes}` : ''}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.expenseRight}>
                      <Text style={styles.expenseAmount}>{formatCurrency(item.amount)}</Text>
                      <Text style={styles.expenseDate}>
                        {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fabWrapper}
        activeOpacity={0.8}
        onPress={() => router.push('/add-expense')}
      >
        <LinearGradient
          colors={[Theme.colors.primary, Theme.colors.primaryDark]}
          style={styles.fab}
        >
          <Ionicons name="add" size={32} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Theme.spacing.sm,
    color: Theme.colors.textSecondary,
    ...Theme.typography.labelMd,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.marginMobile,
    paddingVertical: Theme.spacing.md,
    backgroundColor: '#F8FAFC',
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarText: {
    color: Theme.colors.primaryDark,
    fontSize: 20,
    fontWeight: '700',
  },
  greetingText: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
    marginBottom: 2,
  },
  groupName: {
    ...Theme.typography.headlineMd,
    color: Theme.colors.text,
    fontSize: 22,
    letterSpacing: -0.5,
  },
  switchIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.marginMobile,
    paddingBottom: 100, // padding for FAB
  },
  overviewCard: {
    borderRadius: Theme.rounded.xl,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    marginTop: Theme.spacing.xs,
    shadowColor: Theme.colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  overviewTitle: {
    ...Theme.typography.labelMd,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  shareBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.rounded.full,
    gap: 4,
  },
  shareBadgeText: {
    ...Theme.typography.labelSm,
    color: Theme.colors.primaryDark,
    fontWeight: '700',
  },
  overviewAmount: {
    ...Theme.typography.displayLg,
    color: '#FFF',
    fontSize: 36,
  },
  overviewDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: Theme.spacing.md,
  },
  overviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewFooterRight: {
    alignItems: 'flex-end',
  },
  overviewSubTitle: {
    ...Theme.typography.labelSm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  overviewSubAmount: {
    ...Theme.typography.headlineMd,
    color: '#FFF',
    fontSize: 16,
  },
  textErrorLight: {
    color: '#FFCDD2',
  },
  textSuccessLight: {
    color: '#C8E6C9',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.xl,
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
  },
  actionIconBg: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionLabel: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  expensesSection: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.rounded.xl,
    padding: Theme.spacing.md,
    ...Theme.shadows,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    ...Theme.typography.headlineMd,
    fontSize: 18,
    color: Theme.colors.text,
  },
  refreshBtn: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  emptyStateIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  emptyText: {
    ...Theme.typography.headlineMd,
    fontSize: 16,
    color: Theme.colors.text,
    marginBottom: 4,
  },
  emptySubtext: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  },
  expensesList: {
    gap: 0,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
  },
  expenseItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Theme.spacing.sm,
  },
  categoryIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseCategory: {
    ...Theme.typography.labelMd,
    fontWeight: '600',
    color: Theme.colors.text,
    fontSize: 15,
  },
  expenseMeta: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    ...Theme.typography.labelMd,
    fontWeight: '700',
    color: Theme.colors.text,
    fontSize: 15,
  },
  expenseDate: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  fabWrapper: {
    position: 'absolute',
    bottom: Theme.spacing.lg,
    right: Theme.spacing.lg,
    shadowColor: Theme.colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
