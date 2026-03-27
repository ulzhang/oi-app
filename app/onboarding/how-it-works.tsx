import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing } from '../../constants/theme';

const steps = [
  {
    number: '1',
    icon: '👆',
    title: 'Tap start',
    description: 'One tap to activate the rear camera.',
  },
  {
    number: '2',
    icon: '📹',
    title: 'Camera floats on screen',
    description: 'A Picture-in-Picture window shows what\'s ahead.',
  },
  {
    number: '3',
    icon: '🚶',
    title: 'Keep walking safely',
    description: 'Glance at the floating window to see where you\'re going.',
  },
];

export default function HowItWorksScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.stepsSection}>
          <Text style={styles.heading}>How it works</Text>
          <View style={styles.stepsContainer}>
            {steps.map((step, index) => (
              <View key={step.number} style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <View style={styles.stepNumberContainer}>
                    <Text style={styles.stepNumber}>{step.number}</Text>
                  </View>
                  {index < steps.length - 1 && <View style={styles.connector} />}
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepIcon}>{step.icon}</Text>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomSection}>
          <Pressable
            onPress={() => router.push('/onboarding/permissions')}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>Next</Text>
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
  stepsSection: {
    flex: 1,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xxl,
    letterSpacing: -0.5,
  },
  stepsContainer: {
    gap: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 100,
  },
  stepLeft: {
    width: 40,
    alignItems: 'center',
  },
  stepNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  connector: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  stepContent: {
    flex: 1,
    marginLeft: spacing.md,
    paddingBottom: spacing.lg,
  },
  stepIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
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
  buttonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
