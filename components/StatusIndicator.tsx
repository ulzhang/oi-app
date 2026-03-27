import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../constants/theme';

type State = 'idle' | 'starting' | 'active' | 'error';

interface StatusIndicatorProps {
  state: State;
  message?: string;
}

const stateConfig: Record<State, { icon: string; defaultMessage: string; color: string }> = {
  idle: { icon: '○', defaultMessage: 'Tap to start', color: colors.textSecondary },
  starting: { icon: '◌', defaultMessage: 'Starting camera...', color: colors.primary },
  active: { icon: '●', defaultMessage: 'PiP is active — look up!', color: '#34C759' },
  error: { icon: '✕', defaultMessage: 'Something went wrong', color: colors.danger },
};

export default function StatusIndicator({ state, message }: StatusIndicatorProps) {
  const config = stateConfig[state];
  const displayMessage = message || config.defaultMessage;

  return (
    <View style={styles.container}>
      <Text style={[styles.icon, { color: config.color }]}>{config.icon}</Text>
      <Text style={[styles.message, { color: config.color }]}>{displayMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
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
});
