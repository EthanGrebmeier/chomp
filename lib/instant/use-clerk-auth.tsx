import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useInitializeDefaultGroceryList } from '../../features/grocery-lists/instant/useInitializeDefaultGroceryList';

import { db } from '.';

let activeAuthControllerId: string | null = null;

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

export const InstantAuthHandler = () => {
  const { isSignedIn } = useAuth();
  const signInToInstant = useInstantSignIn();
  const authTransitionRef = useRef(false);
  const instanceIdRef = useRef(`auth-handler-${Math.random().toString(36).slice(2)}`);
  const [guestInitKey, setGuestInitKey] = useState(0);
  const [isAuthController, setIsAuthController] = useState(false);

  const {
    isLoading: isLoadingInstant,
    error: errorInstant,
    user: userInstant,
  } = db.useAuth();

  const isInstantReady =
    !isLoadingInstant && Boolean(userInstant) && !errorInstant;

  // Initialize default grocery list after Instant auth settles
  useInitializeDefaultGroceryList({
    enabled: isInstantReady && isAuthController,
    initKey: guestInitKey,
  });

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
      isLoadingInstant ||
      authTransitionRef.current ||
      !isAuthController
    ) {
      return;
    }

    const runAuthTransition = async () => {
      authTransitionRef.current = true;
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
      } finally {
        authTransitionRef.current = false;
      }
    };

    void runAuthTransition();
  }, [isSignedIn, isLoadingInstant, isAuthController, signInToInstant]);

  if (isLoadingInstant) {
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
