import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../constants/theme';

type State = 'idle' | 'starting' | 'active' | 'error';

interface PipControlButtonProps {
  state: State;
  onPress: () => void;
}

const BUTTON_SIZE = 180;

const stateConfig: Record<State, { label: string; backgroundColor: string }> = {
  idle: { label: 'Start', backgroundColor: colors.primary },
  starting: { label: 'Starting...', backgroundColor: colors.primary },
  active: { label: 'Stop', backgroundColor: colors.danger },
  error: { label: 'Retry', backgroundColor: colors.textSecondary },
};

export default function PipControlButton({ state, onPress }: PipControlButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;
  const prevStateRef = useRef(state);

  // Pulse animation for starting state
  useEffect(() => {
    if (state === 'starting') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state, pulseAnim]);

  // Animate background transition
  useEffect(() => {
    if (prevStateRef.current !== state) {
      bgAnim.setValue(0);
      Animated.timing(bgAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start();
      prevStateRef.current = state;
    }
  }, [state, bgAnim]);

  const config = stateConfig[state];

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={state === 'starting'}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor: config.backgroundColor,
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) },
            ],
          },
        ]}
      >
        {state === 'starting' ? (
          <ActivityIndicator size="large" color={colors.text} />
        ) : (
          <Text style={styles.label}>{config.label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  label: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
