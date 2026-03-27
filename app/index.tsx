import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OiCameraPipModule from '../modules/my-module';
import PipControlButton from '../components/PipControlButton';
import StatusIndicator from '../components/StatusIndicator';
import { colors, spacing } from '../constants/theme';

type AppState = 'idle' | 'starting' | 'active' | 'error';

type DeviceStatus = {
  batteryLevel: number;
  thermalState: 'nominal' | 'fair' | 'serious' | 'critical';
  isCharging: boolean;
};

const TIMEOUT_KEY = 'autoTimeout';

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `Auto-stop in ${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function MainScreen() {
  const router = useRouter();
  const [appState, setAppState] = useState<AppState>('idle');
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [drainText, setDrainText] = useState<string | undefined>();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startBatteryRef = useRef<number | null>(null);
  const pipStartTimeRef = useRef<number | null>(null);

  // Clear the countdown timer
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRemainingSeconds(null);
  }, []);

  // Start the countdown timer based on the stored timeout value
  const startTimer = useCallback(async () => {
    clearTimer();
    const timeout = await AsyncStorage.getItem(TIMEOUT_KEY);
    const value = timeout || '15'; // default 15 minutes
    if (value === 'never') return;

    const totalSeconds = parseInt(value, 10) * 60;
    setRemainingSeconds(totalSeconds);

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearTimer();
          OiCameraPipModule.stopPip();
          OiCameraPipModule.stopCamera();
          setAppState('idle');
          setStatusMessage(undefined);
          setDeviceStatus(null);
          setDrainText(undefined);
          startBatteryRef.current = null;
          pipStartTimeRef.current = null;
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  // Update battery drain tracking
  const updateDrain = useCallback((currentLevel: number) => {
    if (startBatteryRef.current === null || pipStartTimeRef.current === null) return;
    const elapsedMs = Date.now() - pipStartTimeRef.current;
    const elapsedMin = Math.floor(elapsedMs / 60000);
    if (elapsedMin < 1) return;

    const drain = Math.round(startBatteryRef.current - currentLevel);
    if (drain > 0) {
      setDrainText(`−${drain}% in ${elapsedMin} min`);
    }
  }, []);

  // Listen to PiP state changes
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
            startTimer();
            // Fetch initial device status and record starting battery
            try {
              const status = OiCameraPipModule.getDeviceStatus() as DeviceStatus;
              setDeviceStatus(status);
              startBatteryRef.current = status.batteryLevel;
              pipStartTimeRef.current = Date.now();
            } catch {};
            break;
          case 'stopped':
            setAppState('idle');
            setStatusMessage(undefined);
            clearTimer();
            setDeviceStatus(null);
            setDrainText(undefined);
            startBatteryRef.current = null;
            pipStartTimeRef.current = null;
            break;
          case 'error':
            setAppState('error');
            setStatusMessage(event.message || 'Something went wrong');
            clearTimer();
            break;
        }
      }
    );

    return () => subscription.remove();
  }, [startTimer, clearTimer]);

  // Listen to device status changes (battery/thermal)
  useEffect(() => {
    const subscription = OiCameraPipModule.addListener(
      'onDeviceStatusChanged',
      (event: DeviceStatus) => {
        setDeviceStatus(event);
        updateDrain(event.batteryLevel);
      }
    );

    return () => subscription.remove();
  }, [updateDrain]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handlePress = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (appState === 'active') {
      OiCameraPipModule.stopPip();
      OiCameraPipModule.stopCamera();
      setAppState('idle');
      setStatusMessage(undefined);
      clearTimer();
      setDeviceStatus(null);
      setDrainText(undefined);
      startBatteryRef.current = null;
      pipStartTimeRef.current = null;
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
  }, [appState, clearTimer]);

  const countdownText =
    remainingSeconds !== null ? formatCountdown(remainingSeconds) : undefined;

  const deviceStatusInfo = deviceStatus
    ? {
        batteryLevel: deviceStatus.batteryLevel,
        thermalState: deviceStatus.thermalState,
        isCharging: deviceStatus.isCharging,
        drainText,
      }
    : undefined;

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
        <StatusIndicator
          state={appState}
          message={statusMessage}
          countdownText={countdownText}
          deviceStatus={deviceStatusInfo}
        />
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
