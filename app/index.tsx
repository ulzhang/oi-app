import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import OiCameraPipModule from '../modules/my-module';
import PipControlButton from '../components/PipControlButton';
import StatusIndicator from '../components/StatusIndicator';
import { colors, spacing } from '../constants/theme';

type AppState = 'idle' | 'starting' | 'active' | 'error';

export default function MainScreen() {
  const router = useRouter();
  const [appState, setAppState] = useState<AppState>('idle');
  const [statusMessage, setStatusMessage] = useState<string | undefined>();

  useEffect(() => {
    const subscription = OiCameraPipModule.addListener(
      'onPipStateChanged',
      (event) => {
        switch (event.state) {
          case 'started':
            setAppState('starting');
            setStatusMessage('Starting camera...');
            break;
          case 'active':
            setAppState('active');
            setStatusMessage('PiP is active — look up!');
            break;
          case 'stopped':
            setAppState('idle');
            setStatusMessage(undefined);
            break;
          case 'error':
            setAppState('error');
            setStatusMessage(event.message || 'Something went wrong');
            break;
        }
      }
    );

    return () => subscription.remove();
  }, []);

  const handlePress = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (appState === 'active') {
      OiCameraPipModule.stopPip();
      OiCameraPipModule.stopCamera();
      setAppState('idle');
      setStatusMessage(undefined);
      return;
    }

    try {
      setAppState('starting');
      setStatusMessage('Starting camera...');
      await OiCameraPipModule.startCamera();
      await OiCameraPipModule.startPip();
    } catch (error: any) {
      setAppState('error');
      setStatusMessage(error?.message || 'Failed to start camera');
    }
  }, [appState]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Settings gear */}
      <View style={styles.header}>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => router.push('/settings')}
          style={styles.settingsButton}
          hitSlop={16}
        >
          <Text style={styles.settingsIcon}>⚙</Text>
        </Pressable>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <Text style={styles.title}>Oi.</Text>
        <View style={styles.buttonContainer}>
          <PipControlButton state={appState} onPress={handlePress} />
        </View>
        <StatusIndicator state={appState} message={statusMessage} />
      </View>

      {/* Bottom spacer */}
      <View style={styles.bottomSpacer} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 22,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
    marginBottom: spacing.xxl,
  },
  buttonContainer: {
    marginBottom: spacing.xl,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
