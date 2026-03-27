import React from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useOnboardingComplete } from '../hooks/useOnboardingComplete';
import { colors } from '../constants/theme';

export default function RootLayout() {
  const { isComplete } = useOnboardingComplete();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isComplete === null) return; // still loading

    const inOnboarding = segments[0] === 'onboarding';

    if (!isComplete && !inOnboarding) {
      router.replace('/onboarding/welcome');
    }
    // Don't auto-redirect away from onboarding — let the permissions
    // screen handle navigation to '/' after setComplete() to avoid race
  }, [isComplete, segments]);

  if (isComplete === null) {
    return null; // show nothing while checking onboarding status
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings"
          options={{
            title: 'Settings',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false }}
        />
      </Stack>
    </>
  );
}
