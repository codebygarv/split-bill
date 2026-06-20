import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Clipboard,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGroup } from '../../context/GroupContext';
import api from '../../services/api';
import { Theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Skeleton } from '../../components/Skeleton';

interface Member {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  profileImage?: string;
}

interface Expense {
  _id: string;
  paidBy: { _id: string };
}

export default function MembersScreen() {
  const router = useRouter();
  const { activeGroupId } = useGroup();

  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['members', activeGroupId],
    queryFn: async () => {
      if (!activeGroupId) return null;
      const [groupRes, expensesRes] = await Promise.all([
        api.get(`/groups/${activeGroupId}`),
        api.get(`/expenses/group/${activeGroupId}`),
      ]);
      return {
        groupDetails: groupRes.data,
        expenses: expensesRes.data as Expense[],
      };
    },
    enabled: !!activeGroupId,
  });

  const groupDetails = data?.groupDetails;
  const expenses = data?.expenses || [];

  const copyToClipboard = () => {
    if (groupDetails?.code) {
      Clipboard.setString(groupDetails.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getExpensesCount = (userId: string) => {
    return expenses.filter((e) => e.paidBy?._id === userId).length;
  };

  const members: Member[] = groupDetails?.members || [];
  const inviteCode = groupDetails?.code || '';

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Group Members</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Invite Code Panel */}
        <LinearGradient
          colors={[Theme.colors.primaryLight, Theme.colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.inviteCard}
        >
          <View style={styles.inviteHeader}>
            <Ionicons name="person-add-outline" size={24} color={Theme.colors.primaryDark} />
            <Text style={styles.inviteTitle}>Invite Others</Text>
          </View>
          <Text style={styles.inviteSubtitle}>Share this code with friends to let them join:</Text>
          
          <View style={styles.codeRow}>
            <View style={styles.codeBox}>
              {isLoading ? (
                <Skeleton width={100} height={24} />
              ) : (
                <Text style={styles.codeText}>{inviteCode}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.copyBtn} onPress={copyToClipboard} activeOpacity={0.8} disabled={isLoading}>
              <LinearGradient
                colors={copied ? [Theme.colors.success, '#4CAF50'] : [Theme.colors.primary, Theme.colors.primaryDark]}
                style={styles.copyBtnGradient}
              >
                <Ionicons name={copied ? "checkmark-circle" : "copy-outline"} size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Members List */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>
            {isLoading ? <Skeleton width={120} height={20} /> : `Members (${members.length})`}
          </Text>
          <View style={styles.membersList}>
            {isLoading ? (
              [1, 2, 3].map((key, index) => (
                <View key={key} style={[styles.memberRow, index !== 2 && styles.memberRowBorder]}>
                  <View style={styles.memberLeft}>
                    <Skeleton width={44} height={44} borderRadius={22} />
                    <View>
                      <Skeleton width={120} height={16} style={{ marginBottom: 4 }} />
                      <Skeleton width={80} height={12} />
                    </View>
                  </View>
                  <View style={styles.memberRight}>
                    <Skeleton width={60} height={16} style={{ marginBottom: 4 }} />
                    <Skeleton width={40} height={12} />
                  </View>
                </View>
              ))
            ) : (
              members.map((member, index) => {
                const joinedDate = new Date(member.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });
                const billsAdded = getExpensesCount(member._id);
                const isLast = index === members.length - 1;

                return (
                  <View key={member._id} style={[styles.memberRow, !isLast && styles.memberRowBorder]}>
                    <View style={styles.memberLeft}>
                    {member.profileImage ? (
                      <Image
                        source={{ uri: member.profileImage }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {member.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                      <View>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <Text style={styles.memberJoined}>Joined {joinedDate}</Text>
                      </View>
                    </View>
                    <View style={styles.memberRight}>
                      <Text style={styles.memberBillsCount}>{billsAdded} bills</Text>
                      <Text style={styles.memberRightLabel}>Added</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

      </ScrollView>
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
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Theme.typography.headlineMd,
    color: Theme.colors.text,
    fontSize: 20,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.marginMobile,
    paddingBottom: Theme.spacing.xl,
    gap: Theme.spacing.lg,
  },
  inviteCard: {
    borderRadius: Theme.rounded.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: Theme.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginTop: Theme.spacing.xs,
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  inviteTitle: {
    ...Theme.typography.headlineMd,
    fontSize: 18,
    color: Theme.colors.primaryDark,
  },
  inviteSubtitle: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.md,
  },
  codeRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  codeBox: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.rounded.lg,
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  codeText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 4,
    color: Theme.colors.text,
  },
  copyBtn: {
    width: 48,
    height: 48,
    borderRadius: Theme.rounded.lg,
    shadowColor: Theme.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  copyBtnGradient: {
    flex: 1,
    borderRadius: Theme.rounded.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  membersSection: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.rounded.xl,
    padding: Theme.spacing.md,
    ...Theme.shadows,
  },
  sectionTitle: {
    ...Theme.typography.headlineMd,
    fontSize: 18,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.xs,
  },
  membersList: {
    gap: 0,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.xs,
  },
  memberRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2F1', // Light teal background
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B2DFDB',
  },
  avatarText: {
    color: Theme.colors.primaryDark,
    fontWeight: '700',
    fontSize: 18,
  },
  memberName: {
    ...Theme.typography.labelMd,
    fontWeight: '600',
    color: Theme.colors.text,
    fontSize: 16,
  },
  memberJoined: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  memberRight: {
    alignItems: 'flex-end',
  },
  memberBillsCount: {
    ...Theme.typography.labelMd,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  memberRightLabel: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
    fontSize: 11,
  },
});
