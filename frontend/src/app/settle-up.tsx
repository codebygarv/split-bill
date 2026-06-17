import React, { useState, useTransition } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Theme } from '../constants/theme';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '../components/Skeleton';

interface SettlementRecord {
  _id: string;
  fromUser: { _id: string; name: string; profileImage?: string };
  toUser: { _id: string; name: string; profileImage?: string };
  amount: number;
  status: 'pending' | 'completed';
  date: string;
}

export default function SettleUpScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeGroupId } = useGroup();
  const queryClient = useQueryClient();

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: settlementHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['settlementHistory', activeGroupId],
    queryFn: async () => {
      if (!activeGroupId) return [];
      const res = await api.get(`/settlements/group/${activeGroupId}`);
      return res.data as SettlementRecord[];
    },
    enabled: !!activeGroupId,
  });

  const { data: dashboardData, isLoading: loadingDashboard } = useQuery({
    queryKey: ['dashboard', activeGroupId],
    queryFn: async () => {
      if (!activeGroupId) return null;
      const res = await api.get(`/groups/${activeGroupId}/dashboard`);
      return res.data;
    },
    enabled: !!activeGroupId,
  });

  const handleMarkAsPaid = (toUserId: string, debtAmount: number) => {
    if (!activeGroupId) return;
    setErrorMsg(null);

    startTransition(async () => {
      try {
        await api.post('/settlements', {
          group: activeGroupId,
          toUser: toUserId,
          amount: debtAmount,
        });
        await queryClient.invalidateQueries({ queryKey: ['dashboard', activeGroupId] });
        await queryClient.invalidateQueries({ queryKey: ['settlementHistory', activeGroupId] });
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Failed to submit settlement payment');
      }
    });
  };

  const handleConfirmReceipt = (settlementId: string) => {
    setErrorMsg(null);

    startTransition(async () => {
      try {
        await api.put(`/settlements/${settlementId}/approve`);
        await queryClient.invalidateQueries({ queryKey: ['dashboard', activeGroupId] });
        await queryClient.invalidateQueries({ queryKey: ['settlementHistory', activeGroupId] });
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Failed to confirm receipt');
      }
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const activeBalances = dashboardData?.balances;
  const owesList = activeBalances?.owesList || [];
  const owedList = activeBalances?.owedList || [];

  const pendingIncomingSettlements = settlementHistory.filter(
    (s) => s.toUser?._id === user?._id && s.status === 'pending'
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settle Up</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {errorMsg && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* 1. Pending Approvals (Mark as Received) */}
        {!loadingHistory && pendingIncomingSettlements.length > 0 && (
          <View style={[styles.card, styles.alertBorder]}>
            <Text style={[styles.cardTitle, styles.alertText]}>Pending Confirmations</Text>
            <Text style={styles.cardSubtitle}>Confirm if you have received these payments:</Text>
            
            <View style={styles.listContainer}>
              {pendingIncomingSettlements.map((item) => (
                <View key={item._id} style={styles.settlementActionRow}>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTextMain}>
                      {item.fromUser?.name} paid you {formatCurrency(item.amount)}
                    </Text>
                    <Text style={styles.rowTextSub}>
                      {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={() => handleConfirmReceipt(item._id)}
                    disabled={isPending}
                  >
                    <Text style={styles.confirmBtnText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 2. Debts I Owe (Mark as Paid) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>To Pay</Text>
          {loadingDashboard ? (
             <View style={styles.listContainer}>
                {[1, 2].map((key) => (
                  <View key={key} style={styles.settlementActionRow}>
                    <View style={styles.rowInfo}>
                      <Skeleton width={120} height={16} style={{ marginBottom: 4 }} />
                      <Skeleton width={80} height={16} />
                    </View>
                    <Skeleton width={80} height={32} borderRadius={6} />
                  </View>
                ))}
             </View>
          ) : owesList.length === 0 ? (
            <Text style={styles.emptyText}>🎉 You do not owe anyone in this group.</Text>
          ) : (
            <View style={styles.listContainer}>
              {owesList.map((item: any) => {
                const isPendingLocal = settlementHistory.some(
                  (s) => s.fromUser?._id === user?._id && s.toUser?._id === item.user._id && s.status === 'pending'
                );

                return (
                  <View key={item.user._id} style={styles.settlementActionRow}>
                    <View style={styles.rowInfo}>
                      <Text style={styles.rowTextMain}>
                        To Pay {item.user.name}
                      </Text>
                      <Text style={[styles.rowTextAmount, styles.redText]}>
                        {formatCurrency(item.amount)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.payBtn, isPendingLocal && { backgroundColor: Theme.colors.surfaceContainer }]}
                      onPress={() => handleMarkAsPaid(item.user._id, item.amount)}
                      disabled={isPending || isPendingLocal}
                    >
                      <Text style={[styles.payBtnText, isPendingLocal && { color: Theme.colors.textSecondary }]}>
                        {isPendingLocal ? 'Request Sent' : 'Mark Paid'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 3. Debts Owed to Me */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>To Receive</Text>
          {loadingDashboard ? (
             <View style={styles.listContainer}>
                {[1, 2].map((key) => (
                  <View key={key} style={styles.debtOwedRow}>
                     <Skeleton width={150} height={16} />
                     <Skeleton width={60} height={16} />
                  </View>
                ))}
             </View>
          ) : owedList.length === 0 ? (
            <Text style={styles.emptyText}>Nobody owes you anything currently.</Text>
          ) : (
            <View style={styles.listContainer}>
              {owedList.map((item: any) => (
                <View key={item.user._id} style={styles.debtOwedRow}>
                  <Text style={styles.rowTextMain}>To Receive from {item.user.name}</Text>
                  <Text style={[styles.rowTextAmount, styles.greenText]}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 4. Settlement History log */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Settlement History</Text>
          {loadingHistory ? (
             <View style={styles.historyList}>
               {[1, 2, 3].map((key) => (
                  <View key={key} style={styles.historyRow}>
                    <View>
                      <Skeleton width={140} height={14} style={{ marginBottom: 4 }} />
                      <Skeleton width={80} height={10} />
                    </View>
                    <View style={styles.historyRight}>
                      <Skeleton width={60} height={14} style={{ marginBottom: 4 }} />
                      <Skeleton width={40} height={14} borderRadius={10} />
                    </View>
                  </View>
               ))}
             </View>
          ) : settlementHistory.length === 0 ? (
            <Text style={styles.emptyText}>No settlement payments logged yet.</Text>
          ) : (
            <View style={styles.historyList}>
              {settlementHistory.map((item) => {
                const isFromMe = item.fromUser?._id === user?._id;
                const isToMe = item.toUser?._id === user?._id;
                
                let logText = '';
                if (isFromMe) {
                  logText = `You paid ${item.toUser?.name}`;
                } else if (isToMe) {
                  logText = `${item.fromUser?.name} paid you`;
                } else {
                  logText = `${item.fromUser?.name} paid ${item.toUser?.name}`;
                }

                const isPending = item.status === 'pending';

                return (
                  <View key={item._id} style={styles.historyRow}>
                    <View>
                      <Text style={styles.historyTextMain}>{logText}</Text>
                      <Text style={styles.historyTextSub}>
                        {new Date(item.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={styles.historyAmount}>{formatCurrency(item.amount)}</Text>
                      <View style={[styles.statusBadge, isPending ? styles.badgePending : styles.badgeCompleted]}>
                        <Text style={[styles.statusBadgeText, isPending ? styles.textPending : styles.textCompleted]}>
                          {item.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.marginMobile,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderColor: Theme.colors.border,
  },
  backButton: {
    padding: Theme.spacing.xs,
  },
  backText: {
    color: Theme.colors.primaryDark,
    ...Theme.typography.labelMd,
    fontWeight: '700',
  },
  title: {
    ...Theme.typography.headlineMd,
    color: Theme.colors.text,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.marginMobile,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
    gap: Theme.spacing.md,
  },
  errorBanner: {
    backgroundColor: Theme.colors.errorBg,
    padding: Theme.spacing.md,
    borderRadius: Theme.rounded.md,
  },
  errorText: {
    color: Theme.colors.error,
    ...Theme.typography.labelMd,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.rounded.xl,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows,
  },
  alertBorder: {
    borderColor: Theme.colors.warning,
    borderWidth: 1.5,
  },
  cardTitle: {
    ...Theme.typography.labelMd,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  alertText: {
    color: Theme.colors.warning,
  },
  cardSubtitle: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.sm,
  },
  listContainer: {
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.xs,
  },
  settlementActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    padding: Theme.spacing.sm,
    borderRadius: Theme.rounded.md,
  },
  rowInfo: {
    flex: 1,
  },
  rowTextMain: {
    ...Theme.typography.labelMd,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  rowTextSub: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  rowTextAmount: {
    ...Theme.typography.labelMd,
    fontWeight: '700',
    marginTop: 2,
  },
  redText: {
    color: Theme.colors.error,
  },
  greenText: {
    color: Theme.colors.success,
  },
  confirmBtn: {
    backgroundColor: Theme.colors.warning,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.rounded.md,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    ...Theme.typography.labelSm,
    fontWeight: '700',
  },
  payBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.rounded.md,
  },
  payBtnText: {
    color: '#FFFFFF',
    ...Theme.typography.labelSm,
    fontWeight: '700',
  },
  debtOwedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    padding: Theme.spacing.sm,
    borderRadius: Theme.rounded.md,
  },
  emptyText: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
    paddingVertical: Theme.spacing.xs,
    fontStyle: 'italic',
  },
  historyList: {
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.xs,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.surfaceContainerLow,
    paddingBottom: Theme.spacing.xs,
  },
  historyTextMain: {
    ...Theme.typography.labelSm,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  historyTextSub: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  historyAmount: {
    ...Theme.typography.labelSm,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Theme.rounded.full,
  },
  badgePending: {
    backgroundColor: Theme.colors.warningBg,
  },
  badgeCompleted: {
    backgroundColor: Theme.colors.successBg,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  textPending: {
    color: Theme.colors.warning,
  },
  textCompleted: {
    color: Theme.colors.success,
  },
});
