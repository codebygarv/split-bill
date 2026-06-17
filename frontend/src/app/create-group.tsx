import React, { useState, useTransition } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter } from 'expo-router';
import { useGroup } from '../context/GroupContext';
import { Theme } from '../constants/theme';

const GROUP_TYPES = ['Family', 'Flatmates', 'Friends', 'Trip', 'Office', 'Custom'];

export default function CreateGroupScreen() {
  const router = useRouter();
  const { createGroup } = useGroup();

  const [name, setName] = useState('');
  const [type, setType] = useState('Custom');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (!name.trim()) {
      setErrorMsg('Please enter a group name');
      return;
    }

    setErrorMsg(null);

    startTransition(async () => {
      try {
        await createGroup(name, type);
        // Group context will trigger redirect because activeGroupId changes
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to create group');
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView
        style={styles.keyboardView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={120}
      >
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Create a Group</Text>
            <Text style={styles.subtitle}>Set up a new space to log and split shared bills</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {errorMsg && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Group Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Roommates 402, Road Trip, Family Bills"
                placeholderTextColor={Theme.colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Type selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Group Type</Text>
              <View style={styles.chipsContainer}>
                {GROUP_TYPES.map((gt) => {
                  const isSelected = type === gt;
                  return (
                    <TouchableOpacity
                      key={gt}
                      style={[
                        styles.chip,
                        isSelected && styles.chipSelected,
                      ]}
                      onPress={() => setType(gt)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {gt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={[styles.button, isPending && styles.buttonDisabled]}
              onPress={handleCreate}
              disabled={isPending}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {isPending ? 'Creating Group...' : 'Create Group'}
              </Text>
            </TouchableOpacity>

          </View>
      </KeyboardAwareScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Theme.spacing.marginMobile,
    paddingVertical: Theme.spacing.xl,
  },
  header: {
    marginVertical: Theme.spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: Theme.spacing.md,
  },
  backText: {
    color: Theme.colors.primaryDark,
    ...Theme.typography.labelMd,
    fontWeight: '700',
  },
  title: {
    ...Theme.typography.headlineLg,
    color: Theme.colors.text,
  },
  subtitle: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
  },
  form: {
    width: '100%',
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.lg,
    borderRadius: Theme.rounded.xl,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows,
  },
  errorBanner: {
    backgroundColor: Theme.colors.errorBg,
    padding: Theme.spacing.md,
    borderRadius: Theme.rounded.md,
    marginBottom: Theme.spacing.md,
  },
  errorText: {
    color: Theme.colors.error,
    ...Theme.typography.labelMd,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: Theme.spacing.lg,
  },
  label: {
    ...Theme.typography.labelMd,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.rounded.md,
    paddingHorizontal: Theme.spacing.md,
    color: Theme.colors.text,
    ...Theme.typography.bodyMd,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.xs,
    marginTop: Theme.spacing.xs,
  },
  chip: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.rounded.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: 'rgba(43, 168, 162, 0.1)',
    borderColor: Theme.colors.primary,
  },
  chipText: {
    ...Theme.typography.labelSm,
    color: Theme.colors.textSecondary,
  },
  chipTextSelected: {
    color: Theme.colors.primaryDark,
  },
  button: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.rounded.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Theme.spacing.sm,
    ...Theme.shadows,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Theme.colors.onPrimary,
    ...Theme.typography.labelMd,
    fontWeight: '700',
  },
});
