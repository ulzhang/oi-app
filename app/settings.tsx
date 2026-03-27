import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import OiCameraPipModule from '../modules/my-module';
import { colors, spacing } from '../constants/theme';

const TIMEOUT_KEY = 'autoTimeout';

const timeoutOptions = [
  { label: '5 minutes', value: '5' },
  { label: '15 minutes', value: '15' },
  { label: '30 minutes', value: '30' },
  { label: 'Never', value: 'never' },
];

export default function SettingsScreen() {
  const [selectedTimeout, setSelectedTimeout] = useState('15');

  useEffect(() => {
    AsyncStorage.getItem(TIMEOUT_KEY).then((value) => {
      if (value) setSelectedTimeout(value);
    });
  }, []);

  const handleTimeoutChange = async (value: string) => {
    setSelectedTimeout(value);
    await AsyncStorage.setItem(TIMEOUT_KEY, value);
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Auto-timeout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AUTO-TIMEOUT</Text>
          <View style={styles.card}>
            {timeoutOptions.map((option, index) => (
              <Pressable
                key={option.value}
                onPress={() => handleTimeoutChange(option.value)}
                style={[
                  styles.optionRow,
                  index < timeoutOptions.length - 1 && styles.optionBorder,
                ]}
              >
                <Text style={styles.optionLabel}>{option.label}</Text>
                {selectedTimeout === option.value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Siri Shortcuts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SIRI</Text>
          <View style={styles.card}>
            <Pressable
              onPress={() => {
                OiCameraPipModule.donateSiriShortcut();
                Alert.alert(
                  'Shortcut Added',
                  'Say "Hey Siri, Start Oi" to launch PiP hands-free. You can customize the phrase in the Shortcuts app.',
                  [{ text: 'OK' }]
                );
              }}
              style={styles.optionRow}
            >
              <Text style={styles.optionLabel}>Add "Start Oi" to Siri</Text>
              <Text style={styles.checkmark}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT OI</Text>
          <View style={styles.card}>
            <View style={styles.aboutContent}>
              <Text style={styles.aboutText}>
                Oi is a pedestrian safety app that uses your rear camera in a
                Picture-in-Picture window so you can see what's ahead while
                walking.
              </Text>
            </View>
          </View>
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRIVACY</Text>
          <View style={styles.card}>
            <View style={styles.aboutContent}>
              <Text style={styles.aboutText}>
                Your camera feed is displayed in real-time on your device only.
                Nothing is ever recorded, stored, or transmitted. Oi has no
                servers, no analytics, and no tracking.
              </Text>
            </View>
          </View>
        </View>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Oi v{appVersion}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  optionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionLabel: {
    fontSize: 17,
    color: colors.text,
  },
  checkmark: {
    fontSize: 17,
    color: colors.primary,
    fontWeight: '600',
  },
  aboutContent: {
    padding: spacing.md,
  },
  aboutText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  versionText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
