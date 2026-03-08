import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { toast } from 'sonner-native';

import { useInitializeDefaultGroceryList } from '../../features/grocery-lists/instant/useInitializeDefaultGroceryList';
import { consumeManualSignOutIntent } from '../clerk/signout-intent';

import { db } from '.';

let activeAuthControllerId: string | null = null;
const AUTH_LOADING_TIMEOUT_MS = 4000;

const signInWithClerkToken = async (getToken: () => Promise<string | null>) => {
  const idToken = await getToken();

  if (!idToken) {
    throw new Error('Missing Clerk ID token');
  }

  await db.auth.signInWithIdToken({
    clientName: process.env.EXPO_PUBLIC_INSTANT_CLIENT_NAME!,
    idToken,
  });
};

export const useInstantSignIn = () => {
  const { getToken } = useAuth();

  return useCallback(async () => {
    try {
      await signInWithClerkToken(getToken);
    } catch {
      // Avoid blocking UI when Instant sign-in fails
    }
  }, [getToken]);
};

type InstantAuthHandlerProps = {
  showBlockingOverlay?: boolean;
  onBlockingAuthLoadChange?: (isBlocking: boolean) => void;
};

export const InstantAuthHandler = ({
  showBlockingOverlay = true,
  onBlockingAuthLoadChange,
}: InstantAuthHandlerProps = {}) => {
  const { isSignedIn } = useAuth();
  const signInToInstant = useInstantSignIn();
  const authTransitionRef = useRef(false);
  const previousIsSignedInRef = useRef<boolean | undefined>(isSignedIn);
  const instanceIdRef = useRef(
    `auth-handler-${Math.random().toString(36).slice(2)}`
  );
  const [guestInitKey, setGuestInitKey] = useState(0);
  const [isAuthController, setIsAuthController] = useState(false);
  const [hasAuthLoadingTimedOut, setHasAuthLoadingTimedOut] = useState(false);
  const router = useRouter();

  const {
    isLoading: isLoadingInstant,
    error: errorInstant,
    user: userInstant,
  } = db.useAuth();

  const isInstantReady =
    !isLoadingInstant && Boolean(userInstant) && !errorInstant;
  const isBlockingAuthLoad = isLoadingInstant && !hasAuthLoadingTimedOut;

  useEffect(() => {
    onBlockingAuthLoadChange?.(isBlockingAuthLoad);
  }, [isBlockingAuthLoad, onBlockingAuthLoadChange]);

  // Initialize default grocery list after Instant auth settles
  useInitializeDefaultGroceryList({
    enabled: isInstantReady && isAuthController,
    initKey: guestInitKey,
  });

  useEffect(() => {
    if (!isLoadingInstant) {
      setHasAuthLoadingTimedOut(false);
      return;
    }

    const timeout = setTimeout(() => {
      setHasAuthLoadingTimedOut(true);
    }, AUTH_LOADING_TIMEOUT_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [isLoadingInstant]);

  useEffect(() => {
    const instanceId = instanceIdRef.current;
    if (!activeAuthControllerId) {
      activeAuthControllerId = instanceId;
      setIsAuthController(true);
    }
    return () => {
      if (activeAuthControllerId === instanceId) {
        activeAuthControllerId = null;
        setIsAuthController(false);
      }
    };
  }, []);

  useEffect(() => {
    if (
      isSignedIn === undefined ||
      isBlockingAuthLoad ||
      authTransitionRef.current ||
      !isAuthController
    ) {
      return;
    }

    const runAuthTransition = async () => {
      authTransitionRef.current = true;
      const didTransitionFromSignedIn =
        previousIsSignedInRef.current === true && isSignedIn === false;
      const shouldSuppressSignOutToast = didTransitionFromSignedIn
        ? consumeManualSignOutIntent()
        : false;

      try {
        const existingAuth = await db.getAuth();
        if (isSignedIn) {
          if (existingAuth?.email) {
            return;
          }
          await db.auth.signOut();
          await signInToInstant();
          return;
        }

        if (existingAuth && !existingAuth.email) {
          return;
        }

        await db.auth.signOut();
        await db.auth.signInAsGuest();
        setGuestInitKey(prev => prev + 1);

        if (didTransitionFromSignedIn && !shouldSuppressSignOutToast) {
          toast.info('Your session expired. Please sign in again.');
          router.replace('/(auth)/sign-in-email');
        }
      } finally {
        authTransitionRef.current = false;
        previousIsSignedInRef.current = isSignedIn;
      }
    };

    void runAuthTransition();
  }, [isSignedIn, isBlockingAuthLoad, isAuthController, signInToInstant]);

  if (showBlockingOverlay && isBlockingAuthLoad) {
    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        className="absolute inset-0 z-20 items-center justify-center bg-background"
      >
        <ActivityIndicator color="white" />
      </Animated.View>
    );
  }

  return null;
};
