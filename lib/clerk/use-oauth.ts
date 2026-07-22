import { useAuth } from '@clerk/expo';
import { useSignInWithApple } from '@clerk/expo/apple';
import { useSignInWithGoogle } from '@clerk/expo/google';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { toast } from 'sonner-native';

import { initializeDefaultGroceryList } from '@/features/grocery-lists/instant/useInitializeDefaultGroceryList';
import {
  InstantBridgeError,
  useInstantSignIn,
} from '@/lib/instant/use-clerk-auth';

type OAuthStrategy = 'oauth_google' | 'oauth_apple';

export function useOAuthFlow() {
  const { startGoogleAuthenticationFlow } = useSignInWithGoogle();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const { signOut } = useAuth();
  const router = useRouter();
  const signInToInstant = useInstantSignIn();

  const [isLoading, setIsLoading] = useState<OAuthStrategy | null>(null);

  const resetToSignedOutState = useCallback(async () => {
    try {
      await signOut();
    } catch {
      // Best effort: keep auth layers aligned when Instant sign-in fails.
    }
  }, [signOut]);

  const handleGoogleOAuth = useCallback(async () => {
    try {
      setIsLoading('oauth_google');

      const { createdSessionId, setActive, signIn, signUp } =
        await startGoogleAuthenticationFlow();
      const shouldCreateDefaultList = signUp?.status === 'complete';

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        try {
          await signInToInstant();
          if (shouldCreateDefaultList) {
            await initializeDefaultGroceryList();
          }
          router.replace('/(tabs)');
        } catch (error) {
          if (error instanceof InstantBridgeError) {
            toast.error(
              'Network issue finishing sign-in. Your account is still signed in.'
            );
            return;
          }

          await resetToSignedOutState();
          toast.error('We could not finish signing you in. Please try again.');
        }
        return;
      }

      if (signUp?.status === 'missing_requirements') {
        router.push('/(auth)/continue');
        return;
      }

      if (signIn?.status === 'needs_first_factor') {
        toast.error('Additional verification required. Please try again.');
        return;
      }

      toast.error('Sign in incomplete. Please try again.');
    } catch (err: unknown) {
      // Don't show error for user cancellation
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err.code === 'SIGN_IN_CANCELLED' || err.code === '-5')
      ) {
        return;
      }
      // eslint-disable-next-line no-console
      console.error('Google sign in error:', err);
      toast.error('Sign in failed. Please try again.');
    } finally {
      setIsLoading(null);
    }
  }, [
    resetToSignedOutState,
    router,
    signInToInstant,
    startGoogleAuthenticationFlow,
  ]);

  const handleAppleSignIn = useCallback(async () => {
    try {
      setIsLoading('oauth_apple');

      const { createdSessionId, setActive, signIn, signUp } =
        await startAppleAuthenticationFlow();
      const shouldCreateDefaultList = signUp?.status === 'complete';

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        try {
          await signInToInstant();
          if (shouldCreateDefaultList) {
            await initializeDefaultGroceryList();
          }
          router.replace('/(tabs)');
        } catch (error) {
          if (error instanceof InstantBridgeError) {
            toast.error(
              'Network issue finishing sign-in. Your account is still signed in.'
            );
            return;
          }

          await resetToSignedOutState();
          toast.error('We could not finish signing you in. Please try again.');
        }
        return;
      }

      if (signUp?.status === 'missing_requirements') {
        router.push('/(auth)/continue');
        return;
      }

      if (signIn?.status === 'needs_first_factor') {
        toast.error('Additional verification required. Please try again.');
        return;
      }

      toast.error('Sign in incomplete. Please try again.');
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        err.code === 'ERR_REQUEST_CANCELED'
      ) {
        return;
      }
      // eslint-disable-next-line no-console
      console.error('Apple sign in error:', err);
      toast.error('Apple sign in failed. Please try again.');
    } finally {
      setIsLoading(null);
    }
  }, [
    resetToSignedOutState,
    router,
    signInToInstant,
    startAppleAuthenticationFlow,
  ]);

  const signInWithGoogle = useCallback(async () => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
    return handleGoogleOAuth();
  }, [handleGoogleOAuth]);

  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') return;
    return handleAppleSignIn();
  }, [handleAppleSignIn]);

  return {
    signInWithGoogle,
    signInWithApple,
    isLoadingGoogle: isLoading === 'oauth_google',
    isLoadingApple: isLoading === 'oauth_apple',
    isLoading: isLoading !== null,
  };
}
