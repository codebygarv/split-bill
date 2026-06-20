import React, { useState, useEffect, useTransition } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  ScrollView,
  LayoutAnimation,
  UIManager,
  Dimensions,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Theme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const { user } = useAuth();
  const { activeGroupId } = useGroup();
  const queryClient = useQueryClient();

  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Form states
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [notes, setNotes] = useState('');
  const [paidBy, setPaidBy] = useState(user?._id || '');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');

  const handleSplitTypeChange = (type: 'equal' | 'custom') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSplitType(type);
  };

  const [splitMembers, setSplitMembers] = useState<string[]>([]);
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [amountFocused, setAmountFocused] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);
  const [focusedCustomInput, setFocusedCustomInput] = useState<string | null>(null);

  const { data: expense, isLoading: isLoadingExpense } = useQuery({
    queryKey: ['expense', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get(`/expenses/${id}`);
      return res.data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    fetchGroupMembers();
  }, [activeGroupId]);

  useEffect(() => {
    if (isEditing && expense && members.length > 0) {
      setAmount(expense.amount.toString());
      setCategory(expense.category);
      setNotes(expense.notes || '');
      setPaidBy(expense.paidBy?._id || expense.paidBy || '');
      setSplitType(expense.splitType || 'equal');

      if (expense.splitType === 'equal') {
        const splitIds = expense.splitBetween.map((s: any) => s.user?._id || s.user || s);
        setSplitMembers(splitIds);
      } else {
        const customObj: Record<string, string> = {};
        members.forEach(m => {
          customObj[m._id] = '';
        });
        expense.splitBetween.forEach((s: any) => {
          const userId = s.user?._id || s.user || s;
          customObj[userId] = s.amount.toString();
        });
        setCustomSplits(customObj);
      }
    }
  }, [isEditing, expense, members]);

  const fetchGroupMembers = async () => {
    if (!activeGroupId) return;
    try {
      setLoadingMembers(true);
      const res = await api.get(`/groups/${activeGroupId}`);
      setMembers(res.data.members);
      const memberIds = res.data.members.map((m: Member) => m._id);
      setSplitMembers(memberIds);

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

  const handleSubmit = () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Please enter a valid expense amount');
      return;
    }

    setErrorMsg(null);

    startTransition(async () => {
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

        if (isEditing) {
          await api.put(`/expenses/${id}`, payload);
          queryClient.invalidateQueries({ queryKey: ['expense', id] });
        } else {
          await api.post('/expenses', payload);
        }
        queryClient.invalidateQueries({ queryKey: ['dashboard', activeGroupId] });
        queryClient.invalidateQueries({ queryKey: ['notifications', activeGroupId] });
        router.back();
      } catch (err: any) {
        setErrorMsg(err.message || err.response?.data?.message || 'Failed to save expense');
      }
    });
  };

  const numericAmount = parseFloat(amount) || 0;
  const customSplitsSum = Object.keys(customSplits).reduce(
    (acc, id) => acc + (parseFloat(customSplits[id]) || 0),
    0
  );
  const remainingAmount = numericAmount - customSplitsSum;

  if (isEditing && isLoadingExpense) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#004D4A', '#006A66', '#2BA8A2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Expense' : 'Add Expense'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAwareScrollView
          style={styles.keyboardView}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          extraScrollHeight={120}
        >
          <View style={styles.amountSection}>
            <Text style={styles.amountPrompt}>How much?</Text>
            <View style={styles.amountInputRow}>
              <Text style={[styles.currencySymbol, amountFocused && styles.currencySymbolActive]}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                onFocus={() => setAmountFocused(true)}
                onBlur={() => setAmountFocused(false)}
                selectionColor="#FFFFFF"
                autoFocus={!isEditing}
              />
            </View>
          </View>

          <View style={styles.bottomSheet}>
            {errorMsg && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color={Theme.colors.error} style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.name}
                      style={styles.categoryBubbleWrapper}
                      onPress={() => setCategory(cat.name)}
                      activeOpacity={0.8}
                    >
                      {isSelected ? (
                        <LinearGradient
                          colors={['#2BA8A2', '#007A75']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.categoryBubbleSelected}
                        >
                          <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                          <Text style={styles.categoryTextSelected}>{cat.name}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.categoryBubbleUnselected}>
                          <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                          <Text style={styles.categoryText}>{cat.name}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Paid By</Text>
              {loadingMembers ? (
                <ActivityIndicator size="small" color={Theme.colors.primary} style={{ alignSelf: 'flex-start', marginLeft: 8 }} />
              ) : (
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
                      <View style={[styles.payerAvatarOuter, isSelected && styles.payerAvatarOuterSelected]}>
                        <View style={[styles.payerAvatarInner, isSelected && styles.payerAvatarInnerSelected]}>
                          <Text style={[styles.payerInitials, isSelected && styles.payerInitialsSelected]}>
                            {initials}
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={styles.checkBadge}>
                            <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                      <Text style={[styles.payerName, isSelected && styles.payerNameSelected]} numberOfLines={1}>
                        {member.name === user?.name ? 'You' : member.name.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.splitHeaderRow}>
                <Text style={styles.sectionTitle}>Split Options</Text>
              </View>
              <View style={styles.segmentControl}>
                <TouchableOpacity
                  style={[styles.segmentBtn, splitType === 'equal' && styles.segmentBtnActive]}
                  onPress={() => handleSplitTypeChange('equal')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, splitType === 'equal' && styles.segmentTextActive]}>Equally</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentBtn, splitType === 'custom' && styles.segmentBtnActive]}
                  onPress={() => handleSplitTypeChange('custom')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, splitType === 'custom' && styles.segmentTextActive]}>Custom</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.splitList}>
                {loadingMembers ? (
                  <ActivityIndicator size="small" color={Theme.colors.primary} style={{ marginTop: 10 }} />
                ) : members.map((member) => {
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
                        <View style={styles.splitRowLeft}>
                          <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                            {isSelected && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                          </View>
                          <View style={styles.miniAvatar}>
                            <Text style={styles.miniAvatarText}>{initials}</Text>
                          </View>
                          <Text style={styles.splitMemberName}>
                            {member.name === user?.name ? 'You' : member.name}
                          </Text>
                        </View>
                        <Text style={[styles.splitAmountEqual, isSelected && styles.splitAmountEqualActive]}>
                          {share > 0 ? `₹${share.toFixed(2)}` : 'Excluded'}
                        </Text>
                      </TouchableOpacity>
                    );
                  } else {
                    return (
                      <View key={member._id} style={styles.splitRowCustom}>
                        <View style={styles.splitRowLeft}>
                          <View style={styles.miniAvatar}>
                            <Text style={styles.miniAvatarText}>{initials}</Text>
                          </View>
                          <Text style={styles.splitMemberName}>
                            {member.name === user?.name ? 'You' : member.name}
                          </Text>
                        </View>
                        <View style={[
                          styles.customInputContainer,
                          focusedCustomInput === member._id && styles.customInputContainerActive
                        ]}>
                          <Text style={styles.customCurrency}>₹</Text>
                          <TextInput
                            style={styles.customInput}
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

              {splitType === 'custom' && numericAmount > 0 && (
                <View style={[
                  styles.validationBanner,
                  Math.abs(remainingAmount) < 0.05 ? styles.bannerSuccess :
                    remainingAmount > 0 ? styles.bannerWarning : styles.bannerError
                ]}>
                  <Ionicons
                    name={Math.abs(remainingAmount) < 0.05 ? "checkmark-circle" : "alert-circle"}
                    size={18}
                    color={
                      Math.abs(remainingAmount) < 0.05 ? Theme.colors.success :
                        remainingAmount > 0 ? Theme.colors.warning : Theme.colors.error
                    }
                  />
                  <Text style={[
                    styles.validationText,
                    {
                      color: Math.abs(remainingAmount) < 0.05 ? Theme.colors.success :
                        remainingAmount > 0 ? Theme.colors.warning : Theme.colors.error
                    }
                  ]}>
                    {Math.abs(remainingAmount) < 0.05 ? 'Split perfectly!' :
                      remainingAmount > 0 ? `${remainingAmount.toFixed(2)} left to allocate` :
                        `Over allocated by ${Math.abs(remainingAmount).toFixed(2)}`}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <View style={[styles.notesWrapper, notesFocused && styles.notesWrapperActive]}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={notesFocused ? Theme.colors.primary : '#9CA3AF'}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  style={styles.notesInput}
                  placeholder="What was this for?"
                  placeholderTextColor="#9CA3AF"
                  value={notes}
                  onChangeText={setNotes}
                  onFocus={() => setNotesFocused(true)}
                  onBlur={() => setNotesFocused(false)}
                />
              </View>
            </View>

            <View style={{ height: 100 }} />
          </View>
        </KeyboardAwareScrollView>

        <View style={styles.floatingActionContainer}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isPending}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isPending ? ['#9CA3AF', '#6B7280'] : ['#1F2937', '#111827']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitBtn}
            >
              {isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.submitBtnText}>
                {isPending ? (isEditing ? 'Updating...' : 'Saving Expense...') : (isEditing ? 'Update Expense' : 'Save Expense')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#006A66',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  keyboardView: {
    flex: 1,
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  amountPrompt: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: 48,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    marginRight: 8,
    marginTop: -4,
  },
  currencySymbolActive: {
    color: '#FFFFFF',
  },
  amountInput: {
    fontSize: 64,
    fontWeight: '800',
    color: '#FFFFFF',
    minWidth: 100,
    textAlign: 'center',
    padding: 0,
    margin: 0,
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
    minHeight: SCREEN_HEIGHT * 0.6,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  categoryScroll: {
    paddingRight: 20,
    gap: 12,
  },
  categoryBubbleWrapper: {
    shadowColor: '#006A66',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryBubbleSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
  },
  categoryBubbleUnselected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  categoryTextSelected: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  payerScroll: {
    gap: 20,
    paddingRight: 20,
  },
  payerCard: {
    alignItems: 'center',
    width: 60,
  },
  payerAvatarOuter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  payerAvatarOuterSelected: {
    borderColor: '#2BA8A2',
  },
  payerAvatarInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payerAvatarInnerSelected: {
    backgroundColor: '#E6F4F2',
  },
  payerInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  payerInitialsSelected: {
    color: '#006A66',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#2BA8A2',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  payerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  payerNameSelected: {
    color: '#111827',
    fontWeight: '700',
  },
  splitHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  segmentTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  splitList: {
    gap: 12,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  splitRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: '#2BA8A2',
    borderColor: '#2BA8A2',
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  miniAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  splitMemberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  splitAmountEqual: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  splitAmountEqualActive: {
    color: '#111827',
    fontWeight: '700',
  },
  splitRowCustom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    width: 120,
  },
  customInputContainerActive: {
    borderColor: '#2BA8A2',
    backgroundColor: '#FFFFFF',
  },
  customCurrency: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2BA8A2',
    marginRight: 6,
  },
  customInput: {
    // flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    height: '100%',
  },
  validationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    borderWidth: 1,
    gap: 8,
  },
  bannerSuccess: {
    backgroundColor: Theme.colors.successBg,
    borderColor: 'rgba(0, 110, 40, 0.15)',
  },
  bannerWarning: {
    backgroundColor: Theme.colors.warningBg,
    borderColor: 'rgba(214, 138, 0, 0.15)',
  },
  bannerError: {
    backgroundColor: Theme.colors.errorBg,
    borderColor: 'rgba(186, 26, 26, 0.15)',
  },
  validationText: {
    fontSize: 13,
    fontWeight: '700',
  },
  notesWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  notesWrapperActive: {
    borderColor: '#2BA8A2',
    backgroundColor: '#FFFFFF',
  },
  notesInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    height: '100%',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.errorBg,
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.2)',
  },
  errorText: {
    color: Theme.colors.error,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  floatingActionContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 20,
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
