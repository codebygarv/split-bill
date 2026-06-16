import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGroup } from '../../context/GroupContext';
import api from '../../services/api';
import { Theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface NotificationItem {
  _id: string;
  message: string;
  type: string;
  date: string;
}

const NOTIFICATION_ICONS: Record<string, { name: any; color: string; bg: string }> = {
  expense_added: { name: 'receipt-outline', color: '#1976D2', bg: '#E3F2FD' },
  expense_updated: { name: 'pencil-outline', color: '#F57C00', bg: '#FFF3E0' },
  expense_deleted: { name: 'trash-outline', color: '#D32F2F', bg: '#FFEBEE' },
  member_joined: { name: 'person-add-outline', color: '#388E3C', bg: '#E8F5E9' },
  settlement_logged: { name: 'cash-outline', color: '#7B1FA2', bg: '#F3E5F5' },
  settlement_completed: { name: 'checkmark-circle-outline', color: '#4CAF50', bg: '#E8F5E9' },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { activeGroupId } = useGroup();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [activeGroupId]);

  const fetchNotifications = async () => {
    if (!activeGroupId) return;
    try {
      setLoading(true);
      const res = await api.get(`/notifications/group/${activeGroupId}`);
      setNotifications(res.data);
    } catch (err) {
      console.log('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Loading Activity...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Group Activity</Text>
        <TouchableOpacity onPress={fetchNotifications} style={styles.iconBtn}>
          <Ionicons name="refresh" size={24} color={Theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBadge}>
             <Ionicons name="notifications-off-outline" size={40} color={Theme.colors.textSecondary} />
          </View>
          <Text style={styles.emptyText}>No activity logged yet.</Text>
          <Text style={styles.emptySubtext}>Recent actions like adding bills or paying debts will show up here.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const iconDef = NOTIFICATION_ICONS[item.type] || { name: 'notifications-outline', color: '#607D8B', bg: '#ECEFF1' };
            const isLast = index === notifications.length - 1;
            
            return (
              <View style={[styles.notificationRow, !isLast && styles.notificationRowBorder]}>
                <View style={[styles.iconContainer, { backgroundColor: iconDef.bg }]}>
                  <Ionicons name={iconDef.name} size={20} color={iconDef.color} />
                </View>
                <View style={styles.messageContainer}>
                  <Text style={styles.messageText}>{item.message}</Text>
                  <Text style={styles.timeText}>{formatTimeAgo(item.date)}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
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
  header: {
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
  listContent: {
    paddingHorizontal: Theme.spacing.marginMobile,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.xl,
    gap: 0,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
  },
  notificationRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  messageContainer: {
    flex: 1,
  },
  messageText: {
    ...Theme.typography.labelMd,
    color: Theme.colors.text,
    lineHeight: 20,
    fontSize: 15,
  },
  timeText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xl,
  },
  emptyIconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  emptyText: {
    ...Theme.typography.headlineMd,
    color: Theme.colors.text,
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubtext: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
