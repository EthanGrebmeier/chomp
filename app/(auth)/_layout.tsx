import { Redirect, Stack, useSegments } from 'expo-router';

import { useInstantAuthState } from '@/lib/instant/use-clerk-auth';

export default function AuthLayout() {
  const {
    hasInstantEmailSession,
    hasInstantGuestSession,
    isGuestContinuationPending,
    isReconciled,
    isSignedInWithClerk,
  } = useInstantAuthState();
  const segments = useSegments();
  const isAuthEntryRoute = segments.length === 1;

  if (
    isReconciled &&
    (hasInstantEmailSession || isSignedInWithClerk) &&
    !isGuestContinuationPending
  ) {
    return <Redirect href="/(tabs)" withAnchor />;
  }

  if (
    isReconciled &&
    hasInstantGuestSession &&
    isAuthEntryRoute &&
    !isGuestContinuationPending
  ) {
    return <Redirect href="/(tabs)" withAnchor />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
