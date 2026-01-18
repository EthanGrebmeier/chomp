import { useOAuth, useSSO, useSignIn, useSignUp } from '@clerk/clerk-expo';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { toast } from 'sonner-native';

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
  const { signIn, setActive: setSignInActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const { startOAuthFlow: startAppleOAuth } = useOAuth({
    strategy: 'oauth_apple',
  });

  const [isLoading, setIsLoading] = useState<OAuthStrategy | null>(null);

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

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/');
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
  }, [router, startSSOFlow]);

  const handleAppleOAuth = useCallback(async () => {
    try {
      setIsLoading('oauth_apple');

      const { createdSessionId, setActive } = await startAppleOAuth({
        redirectUrl: AuthSession.makeRedirectUri({
          scheme: 'chomp',
          path: 'oauth-callback',
        }),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/');
      }
    } catch (err) {
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
  }, [router, startAppleOAuth]);

  const handleNativeAppleSignIn = useCallback(async () => {
    if (!signIn || !signUp) return;

    try {
      setIsLoading('oauth_apple');

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { identityToken } = credential;

      if (!identityToken) {
        throw new Error('No identity token received from Apple');
      }

      // Try to sign in with the Apple ID token
      const signInAttempt = await signIn.create({
        strategy: 'oauth_token_apple',
        token: identityToken,
      });

      if (signInAttempt.status === 'complete') {
        await setSignInActive({ session: signInAttempt.createdSessionId });
        return;
      }

      // If sign in didn't complete, try sign up
      const signUpAttempt = await signUp.create({
        strategy: 'oauth_token_apple',
        token: identityToken,
      });

      if (signUpAttempt.status === 'complete') {
        await setSignUpActive({ session: signUpAttempt.createdSessionId });
      }
    } catch (err) {
      console.error('Apple sign in error:', err);
      // Don't show error for user cancellation (error code 1001)
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        err.code !== 'ERR_REQUEST_CANCELED'
      ) {
        toast.error('Apple sign in failed. Please try again.');
      }
    } finally {
      setIsLoading(null);
    }
  }, [signIn, signUp, setSignInActive, setSignUpActive]);

  const signInWithGoogle = useCallback(() => {
    return handleGoogleOAuth();
  }, [handleGoogleOAuth]);

  const signInWithApple = useCallback(async () => {
    // Use native Apple Sign-In on iOS, fall back to web OAuth on other platforms
    if (Platform.OS === 'ios') {
      return handleNativeAppleSignIn();
    }
    return handleAppleOAuth();
  }, [handleNativeAppleSignIn, handleAppleOAuth]);

  return {
    signInWithGoogle,
    signInWithApple,
    isLoadingGoogle: isLoading === 'oauth_google',
    isLoadingApple: isLoading === 'oauth_apple',
    isLoading: isLoading !== null,
  };
}

// Hook to check if Apple authentication is available
export function useAppleAuthAvailable() {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // Check availability on mount
  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setIsAvailable);
    } else {
      // Apple Sign-In via web OAuth is available on all platforms
      setIsAvailable(true);
    }
  }, []);

  return isAvailable;
}
