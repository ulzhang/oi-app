import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../constants/theme';

type State = 'idle' | 'starting' | 'active' | 'error';
type ThermalState = 'nominal' | 'fair' | 'serious' | 'critical';

interface DeviceStatusInfo {
  batteryLevel: number;
  thermalState: ThermalState;
  isCharging: boolean;
  drainText?: string;
}

interface StatusIndicatorProps {
  state: State;
  message?: string;
  countdownText?: string;
  deviceStatus?: DeviceStatusInfo;
}

const stateConfig: Record<State, { icon: string; defaultMessage: string; color: string }> = {
  idle: { icon: '○', defaultMessage: 'Tap to start', color: colors.textSecondary },
  starting: { icon: '◌', defaultMessage: 'Starting camera...', color: colors.primary },
  active: { icon: '●', defaultMessage: 'PiP is active — look up!', color: '#34C759' },
  error: { icon: '✕', defaultMessage: 'Something went wrong', color: colors.danger },
};

const thermalColors: Record<ThermalState, string> = {
  nominal: '#34C759',
  fair: '#FFD60A',
  serious: colors.primary,
  critical: colors.danger,
};

export default function StatusIndicator({
  state,
  message,
  countdownText,
  deviceStatus,
}: StatusIndicatorProps) {
  const config = stateConfig[state];
  const displayMessage = message || config.defaultMessage;

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <Text style={[styles.icon, { color: config.color }]}>{config.icon}</Text>
        <Text style={[styles.message, { color: config.color }]}>{displayMessage}</Text>
      </View>

      {state === 'active' && countdownText && (
        <Text style={styles.countdown}>{countdownText}</Text>
      )}

      {state === 'active' && deviceStatus && (
        <View style={styles.deviceRow}>
          <Text style={styles.deviceText}>
            {deviceStatus.isCharging ? '⚡' : '🔋'} {Math.round(deviceStatus.batteryLevel)}%
          </Text>
          <View style={styles.thermalContainer}>
            <View
              style={[
                styles.thermalDot,
                { backgroundColor: thermalColors[deviceStatus.thermalState] },
              ]}
            />
            <Text style={styles.deviceText}>{deviceStatus.thermalState}</Text>
          </View>
          {deviceStatus.drainText && (
            <Text style={styles.deviceText}>{deviceStatus.drainText}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  icon: {
    fontSize: 14,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  countdown: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  deviceText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  thermalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  thermalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
