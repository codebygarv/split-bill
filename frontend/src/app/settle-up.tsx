import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Theme } from '../constants/theme';

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
  const { activeGroupId, activeGroupData, refreshActiveGroup } = useGroup();

  const [settlementHistory, setSettlementHistory] = useState<SettlementRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [activeGroupId]);

  const fetchHistory = async () => {
    if (!activeGroupId) return;
    try {
      setLoadingHistory(true);
      const res = await api.get(`/settlements/group/${activeGroupId}`);
      setSettlementHistory(res.data);
    } catch (err) {
      console.log('Failed to fetch settlement history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleMarkAsPaid = async (toUserId: string, debtAmount: number) => {
    if (!activeGroupId) return;
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await api.post('/settlements', {
        group: activeGroupId,
        toUser: toUserId,
        amount: debtAmount,
      });
      await refreshActiveGroup();
      await fetchHistory();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit settlement payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReceipt = async (settlementId: string) => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await api.put(`/settlements/${settlementId}/approve`);
      await refreshActiveGroup();
      await fetchHistory();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to confirm receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const activeBalances = activeGroupData?.balances;
  const owesList = activeBalances?.owesList || [];
  const owedList = activeBalances?.owedList || [];

  // Filter settlements where the current user is the recipient (toUser) and the status is pending
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
        {pendingIncomingSettlements.length > 0 && (
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
                    disabled={isSubmitting}
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
          <Text style={styles.cardTitle}>Pay Off Your Debts</Text>
          {owesList.length === 0 ? (
            <Text style={styles.emptyText}>🎉 You do not owe anyone in this group.</Text>
          ) : (
            <View style={styles.listContainer}>
              {owesList.map((item) => (
                <View key={item.user._id} style={styles.settlementActionRow}>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTextMain}>
                      You owe {item.user.name}
                    </Text>
                    <Text style={[styles.rowTextAmount, styles.redText]}>
                      {formatCurrency(item.amount)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.payBtn}
                    onPress={() => handleMarkAsPaid(item.user._id, item.amount)}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.payBtnText}>Mark Paid</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 3. Debts Owed to Me */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Balances Owed to You</Text>
          {owedList.length === 0 ? (
            <Text style={styles.emptyText}>Nobody owes you anything currently.</Text>
          ) : (
            <View style={styles.listContainer}>
              {owedList.map((item) => (
                <View key={item.user._id} style={styles.debtOwedRow}>
                  <Text style={styles.rowTextMain}>{item.user.name} owes you</Text>
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
            <ActivityIndicator size="small" color={Theme.colors.primary} />
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
