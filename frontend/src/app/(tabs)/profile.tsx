import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, logout } = useAuth();

  const [activeView, setActiveView] = useState<'menu' | 'personal' | 'security'>('menu');

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

  const renderMenu = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Avatar Panel */}
      <View style={styles.avatarContainer}>
         <LinearGradient
            colors={[Theme.colors.primary, Theme.colors.primaryDark]}
            style={styles.bigAvatar}
         >
            <Text style={styles.bigAvatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
         </LinearGradient>
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

        <TouchableOpacity style={styles.menuItem} onPress={logout}>
          <View style={[styles.menuIconBox, { backgroundColor: Theme.colors.errorBg }]}>
             <Ionicons name="log-out-outline" size={20} color={Theme.colors.error} />
          </View>
          <Text style={[styles.menuItemText, { color: Theme.colors.error }]}>Sign Out</Text>
        </TouchableOpacity>
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
           activeView === 'personal' ? 'Personal Info' : 'Security'}
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
  bigAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
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
});
