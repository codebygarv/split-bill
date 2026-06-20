import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
  StatusBar,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGroup } from '../../context/GroupContext';
import { Theme } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Skeleton } from '../../components/Skeleton';
import { Image } from 'expo-image';

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
  const { activeGroupId, setActiveGroup } = useGroup();
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const { data: activeGroupData, isLoading, refetch } = useQuery({
    queryKey: ['dashboard', activeGroupId],
    queryFn: async () => {
      if (!activeGroupId) return null;
      const res = await api.get(`/groups/${activeGroupId}/dashboard`);
      return res.data;
    },
    enabled: !!activeGroupId,
  });

  const { data: expenseDetails, isLoading: isLoadingExpense } = useQuery({
    queryKey: ['expense', selectedExpenseId],
    queryFn: async () => {
      if (!selectedExpenseId) return null;
      const res = await api.get(`/expenses/${selectedExpenseId}`);
      return res.data;
    },
    enabled: !!selectedExpenseId,
  });

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

  const handleEditExpense = () => {
    if (!selectedExpenseId) return;
    setShowExpenseModal(false);
    router.push({ pathname: '/add-expense', params: { id: selectedExpenseId } });
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
            {isLoading ? (
              <Skeleton width={44} height={44} borderRadius={22} color="rgba(255,255,255,0.5)" />
            ) : (
              <Text style={styles.avatarText}>{group?.name?.charAt(0)?.toUpperCase() || 'G'}</Text>
            )}
          </View>
          <View>
            <Text style={styles.greetingText}>Welcome to</Text>
            {isLoading ? (
              <Skeleton width={120} height={24} style={{ marginTop: 2 }} />
            ) : (
              <Text style={styles.groupName}>{group?.name || 'Your Group'}</Text>
            )}
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
              {isLoading ? (
                <Skeleton width={60} height={14} color="rgba(0,0,0,0.1)" />
              ) : (
                <Text style={styles.shareBadgeText}>Code: {group?.code}</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <Skeleton width={150} height={40} color="rgba(255,255,255,0.3)" style={{ marginVertical: 4 }} />
          ) : (
            <Text style={styles.overviewAmount}>{formatCurrency(summary?.totalExpenses || 0)}</Text>
          )}

          <View style={styles.overviewDivider} />

          <View style={styles.overviewFooter}>
            <View>
              <Text style={styles.overviewSubTitle}>This Month</Text>
              {isLoading ? (
                <Skeleton width={80} height={20} color="rgba(255,255,255,0.3)" style={{ marginTop: 2 }} />
              ) : (
                <Text style={styles.overviewSubAmount}>{formatCurrency(summary?.thisMonthExpenses || 0)}</Text>
              )}
            </View>
            <View style={styles.overviewFooterRight}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.overviewSubTitle}>Your Balance</Text>
                <TouchableOpacity onPress={() => setShowBreakdownModal(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="help-circle-outline" size={16} color="rgba(255,255,255,0.8)" style={{ marginBottom: 4 }} />
                </TouchableOpacity>
              </View>
              {isLoading ? (
                <Skeleton width={100} height={20} color="rgba(255,255,255,0.3)" style={{ marginTop: 2 }} />
              ) : (
                <Text style={[
                  styles.overviewSubAmount,
                  balances?.youOwe ? styles.textErrorLight : (balances?.youAreOwed ? styles.textSuccessLight : null)
                ]}>
                  {balances?.youOwe ? `To Pay ${formatCurrency(balances.youOwe)}` : (balances?.youAreOwed ? `To Receive ${formatCurrency(balances.youAreOwed)}` : 'Settled up 🎉')}
                </Text>
              )}
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
            <TouchableOpacity onPress={() => refetch()} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={20} color={Theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.expensesList}>
              {[1, 2, 3].map((key, index) => (
                <View key={key} style={[styles.expenseItem, index !== 2 && styles.expenseItemBorder]}>
                  <View style={styles.expenseLeft}>
                    <Skeleton width={40} height={40} borderRadius={12} />
                    <View style={styles.expenseInfo}>
                      <Skeleton width={100} height={16} style={{ marginBottom: 4 }} />
                      <Skeleton width={140} height={12} />
                    </View>
                  </View>
                  <View style={styles.expenseRight}>
                    <Skeleton width={60} height={16} style={{ marginBottom: 4 }} />
                    <Skeleton width={40} height={12} />
                  </View>
                </View>
              ))}
            </View>
          ) : recentExpenses.length === 0 ? (
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
                  <TouchableOpacity 
                    key={item._id} 
                    style={[styles.expenseItem, !isLast && styles.expenseItemBorder]}
                    onPress={() => {
                      setSelectedExpenseId(item._id);
                      setShowExpenseModal(true);
                    }}
                    activeOpacity={0.7}
                  >
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
                  </TouchableOpacity>
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

      {/* Breakdown Modal */}
      <Modal
        visible={showBreakdownModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBreakdownModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Balance Calculation</Text>
              <TouchableOpacity onPress={() => setShowBreakdownModal(false)}>
                <Ionicons name="close" size={24} color={Theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {!balances?.balanceBreakdown || balances.balanceBreakdown.length === 0 ? (
                <Text style={styles.emptyText}>No activity affecting your balance yet.</Text>
              ) : (
                balances.balanceBreakdown.map((item : any, index : any) => {
                  const isPositive = item.type === 'you_are_owed' || item.type === 'settled_to_you';
                  return (
                    <View key={index} style={styles.breakdownItem}>
                      <View style={[styles.breakdownIconBg, { backgroundColor: isPositive ? '#E8F5E9' : '#FFEBEE' }]}>
                        <Ionicons 
                          name={item.type.includes('settled') ? "cash-outline" : "swap-horizontal"} 
                          size={18} 
                          color={isPositive ? Theme.colors.success : Theme.colors.error} 
                        />
                      </View>
                      <View style={styles.breakdownInfo}>
                        <Text style={styles.breakdownMessage}>{item.message}</Text>
                        <Text style={styles.breakdownDate}>
                          {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Expense Detail Modal */}
      <Modal
        visible={showExpenseModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowExpenseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Expense Details</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                {!isLoadingExpense && expenseDetails && (
                  <TouchableOpacity onPress={handleEditExpense}>
                    <Ionicons name="pencil" size={22} color={Theme.colors.primary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowExpenseModal(false)}>
                  <Ionicons name="close" size={24} color={Theme.colors.text} />
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              {isLoadingExpense || !expenseDetails ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={styles.emptyText}>Loading details...</Text>
                </View>
              ) : (
                <View>
                  <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 12 }}>
                    <View style={[styles.categoryIconBg, { backgroundColor: CATEGORY_ICONS[expenseDetails.category]?.bg || CATEGORY_ICONS.Other.bg, width: 64, height: 64, borderRadius: 32, marginBottom: 12 }]}>
                      <Ionicons name={CATEGORY_ICONS[expenseDetails.category]?.name || CATEGORY_ICONS.Other.name} size={32} color={CATEGORY_ICONS[expenseDetails.category]?.color || CATEGORY_ICONS.Other.color} />
                    </View>
                    <Text style={[styles.overviewAmount, { color: Theme.colors.text, fontSize: 32 }]}>{formatCurrency(expenseDetails.amount)}</Text>
                    <Text style={[styles.expenseCategory, { fontSize: 18, marginTop: 4 }]}>{expenseDetails.category}</Text>
                    <Text style={[styles.expenseDate, { fontSize: 14, marginTop: 4 }]}>{new Date(expenseDetails.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                  </View>

                   <View style={{ backgroundColor: Theme.colors.surfaceContainerLow, padding: 16, borderRadius: Theme.rounded.xl, marginBottom: 16 }}>
                    <Text style={[styles.overviewSubTitle, { color: Theme.colors.textSecondary, marginBottom: 12, fontWeight: '700' }]}>Paid By</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {expenseDetails.paidBy?.profileImage ? (
                        <Image
                          source={{ uri: expenseDetails.paidBy.profileImage }}
                          style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12 }}
                        />
                      ) : (
                        <View style={[styles.avatarContainer, { width: 36, height: 36, borderRadius: 18, marginRight: 12 }]}>
                          <Text style={[styles.avatarText, { fontSize: 16 }]}>{expenseDetails.paidBy?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
                        </View>
                      )}
                      <Text style={[styles.breakdownMessage, { fontWeight: '600' }]}>{expenseDetails.paidBy?.name}</Text>
                      <Text style={{ marginLeft: 'auto', fontWeight: '700', fontSize: 16 }}>{formatCurrency(expenseDetails.amount)}</Text>
                    </View>
                  </View>

                  <View style={{ backgroundColor: Theme.colors.surfaceContainerLow, padding: 16, borderRadius: Theme.rounded.xl, marginBottom: 16 }}>
                    <Text style={[styles.overviewSubTitle, { color: Theme.colors.textSecondary, marginBottom: 12, fontWeight: '700' }]}>Split Between</Text>
                    {expenseDetails.splitBetween.map((split: any, idx: number) => (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: idx === expenseDetails.splitBetween.length - 1 ? 0 : 12 }}>
                        {split.user?.profileImage ? (
                          <Image
                            source={{ uri: split.user.profileImage }}
                            style={{ width: 32, height: 32, borderRadius: 16, marginRight: 12 }}
                          />
                        ) : (
                          <View style={[styles.avatarContainer, { width: 32, height: 32, borderRadius: 16, marginRight: 12 }]}>
                            <Text style={[styles.avatarText, { fontSize: 14 }]}>{split.user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
                          </View>
                        )}
                        <Text style={styles.breakdownMessage}>{split.user?.name}</Text>
                        <Text style={{ marginLeft: 'auto', fontWeight: '600' }}>{formatCurrency(split.amount)}</Text>
                      </View>
                    ))}
                  </View>
                  
                  {expenseDetails.notes ? (
                    <View style={{ backgroundColor: Theme.colors.surfaceContainerLow, padding: 16, borderRadius: Theme.rounded.xl }}>
                      <Text style={[styles.overviewSubTitle, { color: Theme.colors.textSecondary, marginBottom: 8, fontWeight: '700' }]}>Notes</Text>
                      <Text style={styles.breakdownMessage}>{expenseDetails.notes}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.rounded.xl,
    borderTopRightRadius: Theme.rounded.xl,
    padding: Theme.spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  modalTitle: {
    ...Theme.typography.headlineMd,
    color: Theme.colors.text,
  },
  modalScroll: {
    paddingBottom: Theme.spacing.xl,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  breakdownIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  breakdownInfo: {
    flex: 1,
  },
  breakdownMessage: {
    ...Theme.typography.labelMd,
    color: Theme.colors.text,
    lineHeight: 20,
  },
  breakdownDate: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
});
