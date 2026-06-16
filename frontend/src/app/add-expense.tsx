import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Theme } from '../constants/theme';

const CATEGORIES = [
  { name: 'Vegetables', emoji: '🥬' },
  { name: 'Grocery', emoji: '🛒' },
  { name: 'Rent', emoji: '🏠' },
  { name: 'Electricity', emoji: '⚡' },
  { name: 'Water', emoji: '💧' },
  { name: 'Internet', emoji: '🌐' },
  { name: 'Transport', emoji: '🚗' },
  { name: 'Entertainment', emoji: '🎬' },
  { name: 'Other', emoji: '📝' },
];

interface Member {
  _id: string;
  name: string;
  email: string;
}

export default function AddExpenseScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeGroupId, refreshActiveGroup } = useGroup();

  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Form states
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [notes, setNotes] = useState('');
  const [paidBy, setPaidBy] = useState(user?._id || '');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  
  // List of member IDs selected for equal split
  const [splitMembers, setSplitMembers] = useState<string[]>([]);
  
  // Custom split amounts: key is userId, value is amount string
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchGroupMembers();
  }, [activeGroupId]);

  const fetchGroupMembers = async () => {
    if (!activeGroupId) return;
    try {
      setLoadingMembers(true);
      const res = await api.get(`/groups/${activeGroupId}`);
      setMembers(res.data.members);
      // Pre-select all members for splitting
      const memberIds = res.data.members.map((m: Member) => m._id);
      setSplitMembers(memberIds);
      
      // Initialize custom splits state with empty strings
      const initialCustom: Record<string, string> = {};
      memberIds.forEach((id: string) => {
        initialCustom[id] = '';
      });
      setCustomSplits(initialCustom);
    } catch (err) {
      console.log('Failed to fetch group members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleToggleMember = (memberId: string) => {
    if (splitMembers.includes(memberId)) {
      // Don't allow empty selection
      if (splitMembers.length > 1) {
        setSplitMembers(splitMembers.filter(id => id !== memberId));
      }
    } else {
      setSplitMembers([...splitMembers, memberId]);
    }
  };

  const handleCustomSplitChange = (memberId: string, value: string) => {
    setCustomSplits({
      ...customSplits,
      [memberId]: value,
    });
  };

  const handleSubmit = async () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Please enter a valid expense amount');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const payload: any = {
        group: activeGroupId,
        amount: numericAmount,
        category,
        notes,
        paidBy,
        splitType,
      };

      if (splitType === 'equal') {
        payload.splitMembers = splitMembers;
      } else {
        // custom splits
        const activeSplits = Object.keys(customSplits)
          .map(userId => ({
            user: userId,
            amount: parseFloat(customSplits[userId]) || 0,
          }))
          .filter(s => s.amount > 0);

        if (activeSplits.length === 0) {
          throw new Error('Please allocate splits for at least one member');
        }

        const sum = activeSplits.reduce((acc, s) => acc + s.amount, 0);
        if (Math.abs(sum - numericAmount) > 0.05) {
          throw new Error(`Total split sum (${sum.toFixed(2)}) must equal the expense amount (${numericAmount.toFixed(2)})`);
        }

        payload.customSplits = activeSplits;
      }

      await api.post('/expenses', payload);
      await refreshActiveGroup();
      router.back();
    } catch (err: any) {
      setErrorMsg(err.message || err.response?.data?.message || 'Failed to add expense');
      setIsSubmitting(false);
    }
  };

  if (loadingMembers) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  const numericAmount = parseFloat(amount) || 0;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add Expense</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting} style={styles.saveButton}>
            <Text style={[styles.saveText, isSubmitting && styles.disabledText]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {errorMsg && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Amount input */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Amount</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor={Theme.colors.textSecondary}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          {/* Category selection */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.name}
                    style={[
                      styles.categoryBtn,
                      isSelected && styles.categoryBtnSelected,
                    ]}
                    onPress={() => setCategory(cat.name)}
                  >
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    <Text style={[
                      styles.categoryBtnText,
                      isSelected && styles.categoryBtnTextSelected,
                    ]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Paid By dropdown */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Paid By</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.payerScroll}>
              {members.map((member) => {
                const isSelected = paidBy === member._id;
                return (
                  <TouchableOpacity
                    key={member._id}
                    style={[
                      styles.payerBtn,
                      isSelected && styles.payerBtnSelected,
                    ]}
                    onPress={() => setPaidBy(member._id)}
                  >
                    <Text style={[
                      styles.payerBtnText,
                      isSelected && styles.payerBtnTextSelected,
                    ]}>
                      {member.name === user?.name ? 'You' : member.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Split Type toggle */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Split Options</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleBtn, splitType === 'equal' && styles.toggleBtnActive]}
                onPress={() => setSplitType('equal')}
              >
                <Text style={[styles.toggleText, splitType === 'equal' && styles.toggleTextActive]}>
                  Equally
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, splitType === 'custom' && styles.toggleBtnActive]}
                onPress={() => setSplitType('custom')}
              >
                <Text style={[styles.toggleText, splitType === 'custom' && styles.toggleTextActive]}>
                  Custom Amounts
                </Text>
              </TouchableOpacity>
            </View>

            {/* Split Details list */}
            <View style={styles.splitList}>
              {members.map((member) => {
                const isSelected = splitMembers.includes(member._id);
                
                if (splitType === 'equal') {
                  const share = isSelected ? (numericAmount / splitMembers.length) : 0;
                  return (
                    <TouchableOpacity
                      key={member._id}
                      style={styles.splitRow}
                      onPress={() => handleToggleMember(member._id)}
                    >
                      <View style={styles.checkboxContainer}>
                        <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                          {isSelected && <Text style={styles.checkboxCheckmark}>✓</Text>}
                        </View>
                        <Text style={styles.splitName}>
                          {member.name === user?.name ? 'You' : member.name}
                        </Text>
                      </View>
                      <Text style={styles.splitShareText}>
                        {share > 0 ? `₹${share.toFixed(2)}` : 'Excluded'}
                      </Text>
                    </TouchableOpacity>
                  );
                } else {
                  // custom split input
                  return (
                    <View key={member._id} style={styles.splitRowCustom}>
                      <Text style={styles.splitName}>
                        {member.name === user?.name ? 'You' : member.name}
                      </Text>
                      <View style={styles.customInputWrapper}>
                        <Text style={styles.currencyPrefix}>₹</Text>
                        <TextInput
                          style={styles.customSplitInput}
                          placeholder="0.00"
                          placeholderTextColor={Theme.colors.textSecondary}
                          keyboardType="numeric"
                          value={customSplits[member._id] || ''}
                          onChangeText={(val) => handleCustomSplitChange(member._id, val)}
                        />
                      </View>
                    </View>
                  );
                }
              })}
            </View>
          </View>

          {/* Notes description */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Description / Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g. Tomato & Onion, Uber ride, Airbnb rent"
              placeholderTextColor={Theme.colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: Theme.colors.error,
    ...Theme.typography.labelMd,
    fontWeight: '600',
  },
  title: {
    ...Theme.typography.headlineMd,
    color: Theme.colors.text,
  },
  saveButton: {
    padding: Theme.spacing.xs,
  },
  saveText: {
    color: Theme.colors.primaryDark,
    ...Theme.typography.labelMd,
    fontWeight: '700',
  },
  disabledText: {
    opacity: 0.5,
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
  cardLabel: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
    fontWeight: '700',
    marginBottom: Theme.spacing.xs,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.xs,
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: '700',
    color: Theme.colors.text,
    marginRight: 6,
  },
  amountInput: {
    fontSize: 40,
    fontWeight: '700',
    color: Theme.colors.text,
    minWidth: 120,
    textAlign: 'left',
  },
  categoryScroll: {
    paddingVertical: Theme.spacing.xs,
    gap: Theme.spacing.xs,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.rounded.full,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 6,
  },
  categoryBtnSelected: {
    backgroundColor: 'rgba(43, 168, 162, 0.1)',
    borderColor: Theme.colors.primary,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  categoryBtnText: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
  },
  categoryBtnTextSelected: {
    color: Theme.colors.primaryDark,
  },
  payerScroll: {
    paddingVertical: Theme.spacing.xs,
    gap: Theme.spacing.xs,
  },
  payerBtn: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.rounded.md,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  payerBtnSelected: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primaryDark,
  },
  payerBtnText: {
    ...Theme.typography.labelSm,
    color: Theme.colors.text,
  },
  payerBtnTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.rounded.md,
    padding: 2,
    marginVertical: Theme.spacing.xs,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: Theme.spacing.xs,
    alignItems: 'center',
    borderRadius: Theme.rounded.sm,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Theme.shadows,
  },
  toggleText: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
  },
  toggleTextActive: {
    color: Theme.colors.primaryDark,
    fontWeight: '700',
  },
  splitList: {
    marginTop: Theme.spacing.md,
    gap: Theme.spacing.sm,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.xs,
  },
  splitRowCustom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.xs,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Theme.colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  checkboxCheckmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  splitName: {
    ...Theme.typography.labelMd,
    color: Theme.colors.text,
  },
  splitShareText: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  customInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.rounded.md,
    paddingHorizontal: Theme.spacing.sm,
    width: 100,
    height: 36,
  },
  currencyPrefix: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
    marginRight: 4,
  },
  customSplitInput: {
    flex: 1,
    color: Theme.colors.text,
    ...Theme.typography.labelSm,
    padding: 0,
  },
  notesInput: {
    height: 48,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.rounded.md,
    paddingHorizontal: Theme.spacing.md,
    color: Theme.colors.text,
    ...Theme.typography.bodyMd,
    marginTop: Theme.spacing.xs,
  },
});
