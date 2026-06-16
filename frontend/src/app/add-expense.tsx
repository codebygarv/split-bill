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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

  // Focus States
  const [amountFocused, setAmountFocused] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);
  const [focusedCustomInput, setFocusedCustomInput] = useState<string | null>(null);

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

  // Live custom splits validation
  const customSplitsSum = Object.keys(customSplits).reduce(
    (acc, id) => acc + (parseFloat(customSplits[id]) || 0),
    0
  );
  const remainingAmount = numericAmount - customSplitsSum;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={Theme.colors.primaryDark} />
            <Text style={styles.headerBackText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Expense</Text>
          <TouchableOpacity 
            onPress={handleSubmit} 
            disabled={isSubmitting} 
            style={styles.headerSaveButtonWrapper}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#2BA8A2', '#007A75']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.headerSaveButton, isSubmitting && styles.saveButtonDisabled]}
            >
              <Text style={styles.headerSaveText}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {errorMsg && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color={Theme.colors.error} style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Amount input */}
          <LinearGradient
            colors={amountFocused ? ['#FFFFFF', '#E6F4F2'] : ['#FFFFFF', '#F9FAFB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.amountCard, amountFocused && styles.amountCardFocused]}
          >
            <Text style={styles.cardLabel}>AMOUNT</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor="rgba(13, 44, 42, 0.3)"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                onFocus={() => setAmountFocused(true)}
                onBlur={() => setAmountFocused(false)}
                selectionColor={Theme.colors.primary}
              />
            </View>
          </LinearGradient>

          {/* Category selection */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.name}
                    style={styles.categoryBtnWrapper}
                    onPress={() => setCategory(cat.name)}
                    activeOpacity={0.8}
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={['#2BA8A2', '#007A75']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.categoryBtnSelected}
                      >
                        <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                        <Text style={styles.categoryBtnTextSelected}>{cat.name}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.categoryBtnUnselected}>
                        <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                        <Text style={styles.categoryBtnText}>{cat.name}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Paid By section */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>PAID BY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.payerScroll}>
              {members.map((member) => {
                const isSelected = paidBy === member._id;
                const initials = member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                return (
                  <TouchableOpacity
                    key={member._id}
                    style={styles.payerCard}
                    onPress={() => setPaidBy(member._id)}
                    activeOpacity={0.8}
                  >
                    {isSelected ? (
                      <View style={styles.payerAvatarOuterRing}>
                        <LinearGradient
                          colors={['#2BA8A2', '#006A66']}
                          style={styles.payerAvatarSelected}
                        >
                          <Text style={styles.payerAvatarTextSelected}>{initials}</Text>
                        </LinearGradient>
                        <View style={styles.avatarCheckBadge}>
                          <Ionicons name="checkmark" size={9} color="#FFFFFF" />
                        </View>
                      </View>
                    ) : (
                      <View style={styles.payerAvatarUnselected}>
                        <Text style={styles.payerAvatarText}>{initials}</Text>
                      </View>
                    )}
                    <Text 
                      style={[
                        styles.payerNameText,
                        isSelected && styles.payerNameTextSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {member.name === user?.name ? 'You' : member.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Split Options section */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>SPLIT OPTIONS</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleBtn, splitType === 'equal' && styles.toggleBtnActive]}
                onPress={() => setSplitType('equal')}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, splitType === 'equal' && styles.toggleTextActive]}>
                  Equally
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, splitType === 'custom' && styles.toggleBtnActive]}
                onPress={() => setSplitType('custom')}
                activeOpacity={0.8}
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
                const initials = member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                
                if (splitType === 'equal') {
                  const share = isSelected ? (numericAmount / splitMembers.length) : 0;
                  return (
                    <TouchableOpacity
                      key={member._id}
                      style={styles.splitRow}
                      onPress={() => handleToggleMember(member._id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.checkboxContainer}>
                        <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                          {isSelected && <Ionicons name="checkmark" size={10} color="#FFFFFF" />}
                        </View>
                        <View style={styles.memberMiniAvatar}>
                          <Text style={styles.memberMiniAvatarText}>{initials}</Text>
                        </View>
                        <Text style={styles.splitName}>
                          {member.name === user?.name ? 'You' : member.name}
                        </Text>
                      </View>
                      <Text style={[styles.splitShareText, isSelected && styles.splitShareTextActive]}>
                        {share > 0 ? `₹${share.toFixed(2)}` : 'Excluded'}
                      </Text>
                    </TouchableOpacity>
                  );
                } else {
                  // custom split input
                  return (
                    <View key={member._id} style={styles.splitRowCustom}>
                      <View style={styles.memberInfoRow}>
                        <View style={styles.memberMiniAvatar}>
                          <Text style={styles.memberMiniAvatarText}>{initials}</Text>
                        </View>
                        <Text style={styles.splitName}>
                          {member.name === user?.name ? 'You' : member.name}
                        </Text>
                      </View>
                      <View style={[
                        styles.customInputWrapper,
                        focusedCustomInput === member._id && styles.customInputWrapperFocused
                      ]}>
                        <Text style={styles.currencyPrefix}>₹</Text>
                        <TextInput
                          style={styles.customSplitInput}
                          placeholder="0.00"
                          placeholderTextColor="rgba(13, 44, 42, 0.3)"
                          keyboardType="numeric"
                          value={customSplits[member._id] || ''}
                          onChangeText={(val) => handleCustomSplitChange(member._id, val)}
                          onFocus={() => setFocusedCustomInput(member._id)}
                          onBlur={() => setFocusedCustomInput(null)}
                          selectionColor={Theme.colors.primary}
                        />
                      </View>
                    </View>
                  );
                }
              })}
            </View>

            {/* Custom split real-time validation status banner */}
            {splitType === 'custom' && numericAmount > 0 && (
              <View style={[
                styles.splitStatusBanner,
                Math.abs(remainingAmount) < 0.05 ? styles.splitStatusBannerSuccess : 
                remainingAmount > 0 ? styles.splitStatusBannerWarning : styles.splitStatusBannerError
              ]}>
                <Ionicons 
                  name={Math.abs(remainingAmount) < 0.05 ? "checkmark-circle" : "alert-circle"} 
                  size={16} 
                  color={
                    Math.abs(remainingAmount) < 0.05 ? Theme.colors.success : 
                    remainingAmount > 0 ? Theme.colors.warning : Theme.colors.error
                  } 
                />
                <Text style={[
                  styles.splitStatusText,
                  {
                    color: Math.abs(remainingAmount) < 0.05 ? Theme.colors.success : 
                           remainingAmount > 0 ? Theme.colors.warning : Theme.colors.error
                  }
                ]}>
                  {Math.abs(remainingAmount) < 0.05 ? 'Total amount split perfectly!' :
                   remainingAmount > 0 ? `Remaining to allocate: ₹${remainingAmount.toFixed(2)}` :
                   `Over split by: ₹${Math.abs(remainingAmount).toFixed(2)}`}
                </Text>
              </View>
            )}
          </View>

          {/* Notes description */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>DESCRIPTION / NOTES (OPTIONAL)</Text>
            <View style={[
              styles.notesInputWrapper,
              notesFocused && styles.notesInputWrapperFocused
            ]}>
              <Ionicons 
                name="document-text-outline" 
                size={20} 
                color={notesFocused ? Theme.colors.primary : Theme.colors.textSecondary} 
                style={styles.notesIcon} 
              />
              <TextInput
                style={styles.notesInput}
                placeholder="What was this expense for?"
                placeholderTextColor={Theme.colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                onFocus={() => setNotesFocused(true)}
                onBlur={() => setNotesFocused(false)}
              />
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F7F5', // Seamless Mint background
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F3F7F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.marginMobile,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderColor: 'rgba(229, 231, 235, 0.8)',
    elevation: 2,
    shadowColor: '#006A66',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  headerBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 106, 102, 0.1)',
    shadowColor: '#006A66',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerBackText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.primaryDark,
    marginLeft: 2,
  },
  headerTitle: {
    ...Theme.typography.headlineMd,
    color: '#0D2C2A',
    fontWeight: '800',
    fontSize: 19,
  },
  headerSaveButtonWrapper: {
    shadowColor: '#2BA8A2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  headerSaveButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  saveButtonDisabled: {
    opacity: 0.6,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.errorBg,
    padding: Theme.spacing.md,
    borderRadius: Theme.rounded.md,
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.15)',
  },
  errorText: {
    color: Theme.colors.error,
    ...Theme.typography.labelMd,
    fontWeight: '600',
    flex: 1,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.rounded.xl,
    padding: Theme.spacing.lg - 4,
    borderWidth: 1.5,
    borderColor: 'rgba(229, 231, 235, 0.7)',
    shadowColor: '#006A66',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
  },
  amountCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.rounded.xl,
    padding: Theme.spacing.lg - 4,
    borderWidth: 1.5,
    borderColor: 'rgba(229, 231, 235, 0.7)',
    shadowColor: '#006A66',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    alignItems: 'center',
  },
  amountCardFocused: {
    borderColor: Theme.colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  cardLabel: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: Theme.spacing.xs,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    width: '100%',
  },
  currencySymbol: {
    fontSize: 34,
    fontWeight: '800',
    color: Theme.colors.primary,
    marginRight: 6,
  },
  amountInput: {
    fontSize: 42,
    fontWeight: '800',
    color: '#0D2C2A',
    minWidth: 150,
    textAlign: 'left',
    paddingVertical: 0,
  },
  categoryScroll: {
    paddingVertical: Theme.spacing.base,
    gap: 8,
  },
  categoryBtnWrapper: {
    marginRight: 8,
  },
  categoryBtnSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Theme.colors.primaryDark,
  },
  categoryBtnUnselected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(229, 231, 235, 0.7)',
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryBtnText: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
    fontWeight: '700',
  },
  categoryBtnTextSelected: {
    color: '#FFFFFF',
    ...Theme.typography.labelSm,
    fontWeight: '700',
  },
  payerScroll: {
    paddingVertical: Theme.spacing.base,
  },
  payerCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 65,
  },
  payerAvatarOuterRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 6,
  },
  payerAvatarSelected: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payerAvatarUnselected: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(229, 231, 235, 0.8)',
    marginBottom: 6,
  },
  payerAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  payerAvatarTextSelected: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  avatarCheckBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: Theme.colors.primaryDark,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  payerNameText: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  payerNameTextSelected: {
    color: Theme.colors.primaryDark,
    fontWeight: '700',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(243, 244, 246, 0.8)',
    borderRadius: Theme.rounded.md,
    padding: 3,
    marginVertical: Theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Theme.rounded.sm + 2,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 106, 102, 0.15)',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  toggleTextActive: {
    color: Theme.colors.primaryDark,
    fontWeight: '700',
  },
  splitList: {
    marginTop: Theme.spacing.md,
    gap: 8,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.4)',
  },
  splitRowCustom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(156, 163, 175, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  memberMiniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(43, 168, 162, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(43, 168, 162, 0.15)',
  },
  memberMiniAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.primaryDark,
  },
  memberInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  splitName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#37474F',
  },
  splitShareText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  splitShareTextActive: {
    color: Theme.colors.primaryDark,
    fontWeight: '700',
  },
  customInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(229, 231, 235, 0.8)',
    borderRadius: Theme.rounded.md,
    paddingHorizontal: Theme.spacing.sm,
    backgroundColor: '#FAFAFA',
    width: 110,
    height: 38,
  },
  customInputWrapperFocused: {
    borderColor: Theme.colors.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  currencyPrefix: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.primary,
    marginRight: 4,
  },
  customSplitInput: {
    flex: 1,
    color: '#0D2C2A',
    fontWeight: '700',
    fontSize: 13,
    padding: 0,
  },
  splitStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.sm + 2,
    borderRadius: Theme.rounded.md,
    marginTop: Theme.spacing.md,
    gap: 6,
    borderWidth: 1,
  },
  splitStatusBannerSuccess: {
    backgroundColor: Theme.colors.successBg,
    borderColor: 'rgba(0, 110, 40, 0.15)',
  },
  splitStatusBannerWarning: {
    backgroundColor: Theme.colors.warningBg,
    borderColor: 'rgba(214, 138, 0, 0.15)',
  },
  splitStatusBannerError: {
    backgroundColor: Theme.colors.errorBg,
    borderColor: 'rgba(186, 26, 26, 0.15)',
  },
  splitStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  notesInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1.5,
    borderColor: 'rgba(229, 231, 235, 0.7)',
    borderRadius: Theme.rounded.md,
    paddingHorizontal: Theme.spacing.md,
    backgroundColor: 'rgba(249, 250, 251, 0.8)',
    marginTop: Theme.spacing.xs,
  },
  notesInputWrapperFocused: {
    borderColor: Theme.colors.primary,
    backgroundColor: '#FFFFFF',
  },
  notesIcon: {
    marginRight: 10,
  },
  notesInput: {
    flex: 1,
    height: '100%',
    color: '#0D2C2A',
    ...Theme.typography.bodyMd,
  },
});
