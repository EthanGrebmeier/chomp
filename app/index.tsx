import { Redirect } from 'expo-router';

import { useInstantAuthState } from '@/lib/instant/use-clerk-auth';

export default function RootIndex() {
  const { hasAppAccess, isReconciled, isSignedInWithClerk } =
    useInstantAuthState();
  const hasSignedInAccess = hasAppAccess || isSignedInWithClerk;

  if (!isReconciled) {
    return null;
  }

  return (
    <Redirect
      href={hasSignedInAccess ? '/(tabs)' : '/(auth)'}
      withAnchor={hasSignedInAccess}
    />
  );
}
