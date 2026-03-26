import { Redirect, Stack, useSegments } from 'expo-router';

import { useInstantAuthState } from '@/lib/instant/use-clerk-auth';

export default function AuthLayout() {
  const {
    hasInstantEmailSession,
    hasInstantGuestSession,
    isGuestContinuationPending,
    isReconciled,
  } = useInstantAuthState();
  const segments = useSegments();
  const isAuthEntryRoute = segments.length === 1;

  if (isReconciled && hasInstantEmailSession && !isGuestContinuationPending) {
    return <Redirect href="/(tabs)" />;
  }

  if (
    isReconciled &&
    hasInstantGuestSession &&
    isAuthEntryRoute &&
    !isGuestContinuationPending
  ) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

