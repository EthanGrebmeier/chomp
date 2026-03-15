import { useAuth, useSignInWithApple, useSSO } from '@clerk/clerk-expo';
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { toast } from 'sonner-native';

import { initializeDefaultGroceryList } from '@/features/grocery-lists/instant/useInitializeDefaultGroceryList';
import { useInstantSignIn } from '@/lib/instant/use-clerk-auth';
// Ensure web browser auth sessions are properly closed
WebBrowser.maybeCompleteAuthSession();

type OAuthStrategy = 'oauth_google' | 'oauth_apple';

// Preloads the browser for Android devices to reduce authentication load time
const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

export function useOAuthFlow() {
  const { startSSOFlow } = useSSO();
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

  useWarmUpBrowser();

  const handleGoogleOAuth = useCallback(async () => {
    try {
      setIsLoading('oauth_google');

      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'chomp',
        path: 'oauth-callback',
      });

      const { createdSessionId, setActive, signIn, signUp } =
        await startSSOFlow({
          strategy: 'oauth_google',
          redirectUrl,
        });
      const shouldCreateDefaultList = signUp?.status === 'complete';

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        try {
          await signInToInstant();
          if (shouldCreateDefaultList) {
            await initializeDefaultGroceryList();
          }
          router.replace('/(tabs)');
        } catch {
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
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('OAuth error:', err);
      // Don't show error for user cancellation
      if (
        err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof err.message === 'string' &&
        !err.message.includes('cancelled') &&
        !err.message.includes('canceled')
      ) {
        toast.error('Sign in failed. Please try again.');
      }
    } finally {
      setIsLoading(null);
    }
  }, [resetToSignedOutState, router, signInToInstant, startSSOFlow]);

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
        } catch {
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

  const signInWithGoogle = useCallback(() => {
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
