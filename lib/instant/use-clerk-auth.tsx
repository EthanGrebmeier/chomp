import { useAuth } from '@clerk/clerk-expo';
import { useRouter, useSegments } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { toast } from 'sonner-native';

import { useInitializeDefaultGroceryList } from '../../features/grocery-lists/instant/useInitializeDefaultGroceryList';
import { consumeManualSignOutIntent } from '../clerk/signout-intent';

import { db } from '.';

let activeAuthControllerId: string | null = null;
const AUTH_LOADING_TIMEOUT_MS = 4000;
const AUTH_RESTORE_RETRY_COUNT = 10;
const AUTH_RESTORE_RETRY_DELAY_MS = 250;
const AUTH_ENTRY_ROUTE = '/(auth)';
const APP_HOME_ROUTE = '/(tabs)';

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const waitForInstantAuthRestore = async () => {
  for (let attempt = 0; attempt < AUTH_RESTORE_RETRY_COUNT; attempt += 1) {
    const auth = await db.getAuth();

    if (auth) {
      return auth;
    }

    await sleep(AUTH_RESTORE_RETRY_DELAY_MS);
  }

  return null;
};

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
    const existingAuth = await db.getAuth();

    if (existingAuth && !existingAuth.email) {
      await db.auth.signOut();
    }

    await signInWithClerkToken(getToken);
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
  const [isAuthController, setIsAuthController] = useState(false);
  const [hasAuthLoadingTimedOut, setHasAuthLoadingTimedOut] = useState(false);
  const [isResolvingAuthState, setIsResolvingAuthState] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  const {
    isLoading: isLoadingInstant,
    error: errorInstant,
    user: userInstant,
  } = db.useAuth();

  const isInstantReady =
    !isLoadingInstant && Boolean(userInstant) && !errorInstant;
  const isBlockingAuthLoad = isLoadingInstant && !hasAuthLoadingTimedOut;
  const shouldBlockAuthUi =
    isSignedIn === undefined || isBlockingAuthLoad || isResolvingAuthState;
  const isOnAuthRoute = useMemo(() => segments[0] === '(auth)', [segments]);
  const isOnAuthEntryRoute = useMemo(
    () => segments[0] === '(auth)' && segments.length === 1,
    [segments]
  );

  useEffect(() => {
    onBlockingAuthLoadChange?.(shouldBlockAuthUi);
  }, [onBlockingAuthLoadChange, shouldBlockAuthUi]);

  // Initialize default grocery list after Instant auth settles
  useInitializeDefaultGroceryList({
    enabled: isInstantReady && isAuthController,
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
      setIsResolvingAuthState(true);
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

          try {
            if (existingAuth) {
              await db.auth.signOut();
            }

            await signInToInstant();
          } catch {
            await db.auth.signOut();
            toast.error('Could not restore your session. Please sign in again.');
            router.replace(AUTH_ENTRY_ROUTE);
          }

          return;
        }

        const stableAuth = existingAuth ?? (await waitForInstantAuthRestore());

        if (stableAuth?.email) {
          await db.auth.signOut();

          if (didTransitionFromSignedIn && !shouldSuppressSignOutToast) {
            toast.info('Your session expired. Please sign in again.');
          }

          router.replace(AUTH_ENTRY_ROUTE);
          return;
        }

        if (stableAuth && !stableAuth.email) {
          if (isOnAuthEntryRoute) {
            router.replace(APP_HOME_ROUTE);
          }

          return;
        }

        if (!stableAuth && !isOnAuthRoute) {
          if (didTransitionFromSignedIn && !shouldSuppressSignOutToast) {
            toast.info('Your session expired. Please sign in again.');
          }

          router.replace(AUTH_ENTRY_ROUTE);
        }
      } finally {
        authTransitionRef.current = false;
        previousIsSignedInRef.current = isSignedIn;
        setIsResolvingAuthState(false);
      }
    };

    void runAuthTransition();
  }, [
    isSignedIn,
    isBlockingAuthLoad,
    isAuthController,
    isOnAuthEntryRoute,
    isOnAuthRoute,
    userInstant?.id,
    errorInstant,
    signInToInstant,
    router,
  ]);

  if (showBlockingOverlay && shouldBlockAuthUi) {
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
