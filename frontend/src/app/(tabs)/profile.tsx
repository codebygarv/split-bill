import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
  Modal
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';
import api from '../../services/api';
import { Theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, logout } = useAuth();
  const { setActiveGroup, deleteGroup } = useGroup();

  const groups = user?.groups || [];

  const [activeView, setActiveView] = useState<'menu' | 'personal' | 'security' | 'groups' | 'feedback'>('menu');

  // Feedback states
  const [feedbackType, setFeedbackType] = useState('Bug');
  const [feedbackDesc, setFeedbackDesc] = useState('');
  const [feedbackImages, setFeedbackImages] = useState<string[]>([]);
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const FEEDBACK_TYPES = [
    'Bug',
    'Feature Request',
    'Enhancement',
    'UI/UX Feedback',
    'Performance Issue',
    'Account Issue',
    'Billing & Payments',
    'App Crash',
    'Spam/Abuse Report',
    'Other'
  ];

  const pickFeedbackImage = async () => {
    if (feedbackImages.length >= 2) {
      Alert.alert('Limit Reached', 'You can attach up to 2 images.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need storage permissions to attach an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setFeedbackImages(prev => [...prev, base64Uri]);
    }
  };

  const removeFeedbackImage = (index: number) => {
    setFeedbackImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSendFeedback = async () => {
    if (!feedbackDesc.trim()) {
      Alert.alert('Error', 'Please enter a description for your feedback.');
      return;
    }

    setSendingFeedback(true);
    try {
      await api.post('/auth/feedback', {
        type: feedbackType,
        description: feedbackDesc,
        images: feedbackImages
      });
      Alert.alert('Success', 'Thank you for your feedback! It has been sent to our developer.');
      setFeedbackDesc('');
      setFeedbackImages([]);
      setFeedbackType('Bug');
      setActiveView('menu');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send feedback.');
    } finally {
      setSendingFeedback(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need storage permissions to change the profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setUpdatingProfile(true);
      try {
        await updateProfile(user?.name || '', user?.phone || '', base64Uri);
        Alert.alert('Success', 'Profile picture updated successfully!');
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to update profile picture.');
      } finally {
        setUpdatingProfile(false);
      }
    }
  };

  // Profile Edit fields
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Password Change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);

  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPwd, setUpdatingPwd] = useState(false);

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      setProfileError('Name cannot be empty');
      return;
    }

    setProfileError(null);
    setProfileSuccess(null);
    setUpdatingProfile(true);

    try {
      await updateProfile(name, phone);
      setProfileSuccess('Profile updated successfully!');
    } catch (err: any) {
      setProfileError(err.message || 'Profile update failed');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdError('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters');
      return;
    }

    setPwdError(null);
    setPwdSuccess(null);
    setUpdatingPwd(true);

    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setPwdSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setUpdatingPwd(false);
    }
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${groupName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGroup(groupId);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete group');
            }
          }
        }
      ]
    );
  };

  const renderMenu = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Avatar Panel */}
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={styles.avatarWrapper}>
          {user?.profileImage ? (
            <Image
              source={{ uri: user.profileImage }}
              style={styles.bigAvatarImage}
            />
          ) : (
            <LinearGradient
              colors={[Theme.colors.primary, Theme.colors.primaryDark]}
              style={styles.bigAvatar}
            >
              <Text style={styles.bigAvatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </LinearGradient>
          )}
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={14} color="#FFF" />
          </View>
        </TouchableOpacity>
        <Text style={styles.profileName}>{user?.name}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
        <View style={styles.badge}>
          <Ionicons name="shield-checkmark" size={12} color={Theme.colors.primaryDark} />
          <Text style={styles.badgeText}>{user?.useCase || 'User'}</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={() => setActiveView('personal')}>
          <View style={[styles.menuIconBox, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="person-outline" size={20} color="#1976D2" />
          </View>
          <Text style={styles.menuItemText}>Personal Information</Text>
          <Ionicons name="chevron-forward" size={20} color={Theme.colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity style={styles.menuItem} onPress={() => setActiveView('security')}>
          <View style={[styles.menuIconBox, { backgroundColor: '#F3E5F5' }]}>
            <Ionicons name="lock-closed-outline" size={20} color="#7B1FA2" />
          </View>
          <Text style={styles.menuItemText}>Security & Password</Text>
          <Ionicons name="chevron-forward" size={20} color={Theme.colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />



        <TouchableOpacity style={styles.menuItem} onPress={() => setActiveView('groups')}>
          <View style={[styles.menuIconBox, { backgroundColor: '#F3E5F5' }]}>
            <Ionicons name="people-outline" size={20} color="#7B1FA2" />
          </View>
          <Text style={styles.menuItemText}>Your Groups</Text>
          <Ionicons name="chevron-forward" size={20} color={Theme.colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity style={styles.menuItem} onPress={() => setActiveView('feedback')}>
          <View style={[styles.menuIconBox, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={Theme.colors.success} />
          </View>
          <Text style={styles.menuItemText}>Send Feedback</Text>
          <Ionicons name="chevron-forward" size={20} color={Theme.colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity style={styles.menuItem} onPress={logout}>
          <View style={[styles.menuIconBox, { backgroundColor: Theme.colors.errorBg }]}>
            <Ionicons name="log-out-outline" size={20} color={Theme.colors.error} />
          </View>
          <Text style={[styles.menuItemText, { color: Theme.colors.error }]}>Sign Out</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );

  const renderGroups = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Groups</Text>
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
                  <View style={styles.groupBadge}>
                    <Text style={styles.groupBadgeText}>{group.type}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <TouchableOpacity
                    onPress={() => handleDeleteGroup(group._id, group.name)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={20} color={Theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderPersonal = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>

        {profileError && (
          <View style={[styles.banner, styles.errBanner]}>
            <Ionicons name="alert-circle" size={16} color={Theme.colors.error} />
            <Text style={[styles.bannerText, styles.errText]}>{profileError}</Text>
          </View>
        )}
        {profileSuccess && (
          <View style={[styles.banner, styles.successBanner]}>
            <Ionicons name="checkmark-circle" size={16} color={Theme.colors.success} />
            <Text style={[styles.bannerText, styles.successText]}>{profileSuccess}</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor={Theme.colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone"
            placeholderTextColor={Theme.colors.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleUpdateProfile}
          disabled={updatingProfile}
        >
          <LinearGradient
            colors={[Theme.colors.primary, Theme.colors.primaryDark]}
            style={[styles.saveBtnGradient, updatingProfile && styles.btnDisabled]}
          >
            <Text style={styles.btnText}>
              {updatingProfile ? 'Saving...' : 'Save Changes'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderSecurity = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Security</Text>

        {pwdError && (
          <View style={[styles.banner, styles.errBanner]}>
            <Ionicons name="alert-circle" size={16} color={Theme.colors.error} />
            <Text style={[styles.bannerText, styles.errText]}>{pwdError}</Text>
          </View>
        )}
        {pwdSuccess && (
          <View style={[styles.banner, styles.successBanner]}>
            <Ionicons name="checkmark-circle" size={16} color={Theme.colors.success} />
            <Text style={[styles.bannerText, styles.successText]}>{pwdSuccess}</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor={Theme.colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Choose new password"
            placeholderTextColor={Theme.colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Verify new password"
            placeholderTextColor={Theme.colors.textSecondary}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleUpdatePassword}
          disabled={updatingPwd}
        >
          <LinearGradient
            colors={[Theme.colors.primary, Theme.colors.primaryDark]}
            style={[styles.saveBtnGradient, updatingPwd && styles.btnDisabled]}
          >
            <Text style={styles.btnText}>
              {updatingPwd ? 'Updating...' : 'Update Password'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderFeedback = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Send Feedback</Text>
        <Text style={styles.feedbackInfo}>Help us improve SplitBill. Report issues or request enhancements below.</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Feedback Type</Text>
          <TouchableOpacity 
            style={styles.dropdownSelector}
            onPress={() => setShowTypePicker(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownSelectorText}>{feedbackType}</Text>
            <Ionicons name="chevron-down" size={18} color={Theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={feedbackDesc}
            onChangeText={setFeedbackDesc}
            placeholder="Tell us what went wrong or what you'd like to see..."
            placeholderTextColor={Theme.colors.textSecondary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, width: '100%' }}>
            <Text style={styles.label}>Screenshots / Images </Text>
            <Text style={{ fontSize: 12, color: Theme.colors.textSecondary }}>{feedbackImages.length} / 2</Text>
          </View>

          <View style={styles.imagePickerRow}>
            {feedbackImages.map((img, idx) => (
              <View key={idx} style={styles.imageThumbnailContainer}>
                <Image source={{ uri: img }} style={styles.feedbackThumbnail} />
                <TouchableOpacity 
                  style={styles.deleteThumbnailBtn}
                  onPress={() => removeFeedbackImage(idx)}
                >
                  <Ionicons name="close-circle" size={20} color={Theme.colors.error} />
                </TouchableOpacity>
              </View>
            ))}

            {feedbackImages.length < 2 && (
              <TouchableOpacity 
                style={styles.addImageBtn}
                onPress={pickFeedbackImage}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-outline" size={28} color={Theme.colors.primary} />
                <Text style={styles.addImageBtnText}>Add Image</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSendFeedback}
          disabled={sendingFeedback}
        >
          <LinearGradient
            colors={[Theme.colors.primary, Theme.colors.primaryDark]}
            style={[styles.saveBtnGradient, sendingFeedback && styles.btnDisabled]}
          >
            <Text style={styles.btnText}>
              {sendingFeedback ? 'Sending...' : 'Send Feedback'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Dropdown Modal Selector */}
      <Modal
        visible={showTypePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTypePicker(false)}
      >
        <TouchableOpacity 
          style={styles.pickerModalOverlay}
          activeOpacity={1}
          onPress={() => setShowTypePicker(false)}
        >
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Feedback Type</Text>
              <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                <Ionicons name="close" size={24} color={Theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
              {FEEDBACK_TYPES.map((typeOption) => (
                <TouchableOpacity
                  key={typeOption}
                  style={[
                    styles.pickerOptionItem,
                    feedbackType === typeOption && styles.pickerOptionItemActive
                  ]}
                  onPress={() => {
                    setFeedbackType(typeOption);
                    setShowTypePicker(false);
                  }}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    feedbackType === typeOption && styles.pickerOptionTextActive
                  ]}>
                    {typeOption}
                  </Text>
                  {feedbackType === typeOption && (
                    <Ionicons name="checkmark" size={20} color={Theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => activeView === 'menu' ? router.back() : setActiveView('menu')}
          style={styles.iconBtn}
        >
          <Ionicons name="arrow-back" size={24} color={Theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {activeView === 'menu' ? 'Your Profile' :
            activeView === 'personal' ? 'Personal Info' :
              activeView === 'groups' ? 'Groups' :
                activeView === 'feedback' ? 'Send Feedback' :
                  'Security'}
        </Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAwareScrollView
        style={styles.keyboardView}
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        extraScrollHeight={120}
      >
        {activeView === 'menu' && renderMenu()}
        {activeView === 'personal' && renderPersonal()}
        {activeView === 'security' && renderSecurity()}
        {activeView === 'groups' && renderGroups()}
        {activeView === 'feedback' && renderFeedback()}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
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
  scrollContent: {
    paddingHorizontal: Theme.spacing.marginMobile,
    paddingBottom: Theme.spacing.xl,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: Theme.spacing.md,
    marginBottom: Theme.spacing.xl,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: Theme.spacing.sm,
  },
  bigAvatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Theme.colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bigAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Theme.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  bigAvatarText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 36,
  },
  profileName: {
    ...Theme.typography.headlineLg,
    fontSize: 22,
    color: Theme.colors.text,
  },
  profileEmail: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.textSecondary,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 6,
    borderRadius: Theme.rounded.full,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  menuContainer: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.rounded.xl,
    paddingVertical: Theme.spacing.xs,
    ...Theme.shadows,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.md,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  menuItemText: {
    flex: 1,
    ...Theme.typography.labelMd,
    fontSize: 16,
    color: Theme.colors.text,
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginLeft: 70, // Align with text
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.rounded.xl,
    padding: Theme.spacing.lg,
    ...Theme.shadows,
    marginTop: Theme.spacing.sm,
  },
  cardTitle: {
    ...Theme.typography.labelMd,
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.sm,
    borderRadius: Theme.rounded.md,
    marginBottom: Theme.spacing.md,
    gap: 6,
  },
  errBanner: {
    backgroundColor: Theme.colors.errorBg,
  },
  errText: {
    color: Theme.colors.error,
  },
  successBanner: {
    backgroundColor: Theme.colors.successBg,
  },
  successText: {
    color: Theme.colors.success,
  },
  bannerText: {
    ...Theme.typography.labelSm,
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.rounded.md,
    paddingHorizontal: Theme.spacing.md,
    color: Theme.colors.text,
    backgroundColor: '#FAFAFA',
    ...Theme.typography.bodyMd,
  },
  saveBtnGradient: {
    paddingVertical: 14,
    borderRadius: Theme.rounded.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Theme.spacing.xs,
    shadowColor: Theme.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: '#FFFFFF',
    ...Theme.typography.labelMd,
    fontWeight: '700',
  },
  emptyCard: {
    padding: Theme.spacing.xl,
    borderRadius: Theme.rounded.xl,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Theme.spacing.md,
  },
  emptyText: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.textSecondary,
  },
  listContainer: {
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.sm,
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
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  groupName: {
    ...Theme.typography.headlineMd,
    fontSize: 16,
    color: Theme.colors.text,
  },
  groupBadge: {
    backgroundColor: 'rgba(43, 168, 162, 0.1)',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.rounded.full,
  },
  groupBadgeText: {
    color: Theme.colors.primaryDark,
    fontSize: 11,
    fontWeight: '600',
  },
  groupArrow: {
    fontSize: 18,
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  feedbackInfo: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.md,
  },
  dropdownSelector: {
    height: 48,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.rounded.md,
    paddingHorizontal: Theme.spacing.md,
    color: Theme.colors.text,
    backgroundColor: '#FAFAFA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownSelectorText: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.text,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  imagePickerRow: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  imageThumbnailContainer: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  feedbackThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: Theme.rounded.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  deleteThumbnailBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  addImageBtn: {
    width: 80,
    height: 80,
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: Theme.rounded.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(43, 168, 162, 0.03)',
  },
  addImageBtnText: {
    fontSize: 10,
    color: Theme.colors.primaryDark,
    fontWeight: '700',
    marginTop: 2,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: Theme.rounded.xl,
    borderTopRightRadius: Theme.rounded.xl,
    padding: Theme.spacing.lg,
    maxHeight: '70%',
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  pickerModalTitle: {
    ...Theme.typography.headlineMd,
    fontSize: 18,
    color: Theme.colors.text,
  },
  pickerScroll: {
    marginBottom: Theme.spacing.lg,
  },
  pickerOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  pickerOptionItemActive: {
    borderBottomColor: Theme.colors.primary,
  },
  pickerOptionText: {
    ...Theme.typography.bodyLg,
    color: Theme.colors.text,
  },
  pickerOptionTextActive: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
});
