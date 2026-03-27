import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import OiCameraPipModule from '../../modules/my-module';
import { useOnboardingComplete } from '../../hooks/useOnboardingComplete';
import { colors, spacing } from '../../constants/theme';

export default function PermissionsScreen() {
  const router = useRouter();
  const { setComplete } = useOnboardingComplete();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleAllowCamera = async () => {
    setIsRequesting(true);
    try {
      // startCamera triggers the native permission request
      await OiCameraPipModule.startCamera();
      // Stop camera immediately — we just needed the permission
      OiCameraPipModule.stopCamera();
      // Mark onboarding done
      await setComplete();
      router.replace('/');
    } catch (error: any) {
      Alert.alert(
        'Camera Access Required',
        'Oi needs camera access to show what\'s ahead of you. Please enable it in Settings.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.mainSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📷</Text>
          </View>

          <Text style={styles.heading}>Camera access</Text>
          <Text style={styles.description}>
            Oi needs your rear camera to show what's ahead of you in a
            floating window while you walk.
          </Text>

          <View style={styles.privacyCard}>
            <Text style={styles.privacyIcon}>🔒</Text>
            <Text style={styles.privacyText}>
              The camera feed stays on your device. Nothing is ever recorded or
              sent anywhere.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <Pressable
            onPress={handleAllowCamera}
            disabled={isRequesting}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              isRequesting && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.buttonText}>
              {isRequesting ? 'Requesting...' : 'Allow Camera Access'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  mainSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  icon: {
    fontSize: 36,
  },
  heading: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  privacyCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  privacyIcon: {
    fontSize: 24,
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bottomSection: {
    paddingTop: spacing.lg,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
