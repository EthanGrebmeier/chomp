import { Redirect } from 'expo-router';

import { useInstantAuthState } from '@/lib/instant/use-clerk-auth';

export default function RootIndex() {
  const { hasAppAccess, isReconciled, isSignedInWithClerk } =
    useInstantAuthState();

  if (!isReconciled) {
    return null;
  }

  return (
    <Redirect
      href={hasAppAccess || isSignedInWithClerk ? '/(tabs)' : '/(auth)'}
    />
  );
}
