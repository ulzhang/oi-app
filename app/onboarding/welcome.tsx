import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing } from '../../constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroSection}>
          <Text style={styles.title}>Oi.</Text>
          <Text style={styles.subtitle}>Look up.</Text>
          <Text style={styles.tagline}>
            See what's ahead while you walk.{'\n'}
            Stay safe, stay aware.
          </Text>
        </View>

        <View style={styles.bottomSection}>
          <Pressable
            onPress={() => router.push('/onboarding/how-it-works')}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>Get Started</Text>
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
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 80,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -2,
  },
  subtitle: {
    fontSize: 32,
    fontWeight: '300',
    color: colors.primary,
    marginTop: spacing.sm,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 26,
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
