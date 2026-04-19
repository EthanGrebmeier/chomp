import { useAuth } from '@clerk/clerk-expo';
import { useRouter, useSegments } from 'expo-router';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { ActivityIndicator } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import { toast } from 'sonner-native';

import {
  consumeManualSignOutIntent,
  markManualSignOutIntent,
} from '../clerk/signout-intent';

import {
  getIsGuestContinuationPending,
  subscribeToGuestContinuationState,
} from './use-continue-as-guest';

import { db } from '.';

let activeAuthControllerId: string | null = null;
const AUTH_LOADING_TIMEOUT_MS = 4000;
const AUTH_RESTORE_RETRY_COUNT = 10;
const AUTH_RESTORE_RETRY_DELAY_MS = 250;
const AUTH_WELCOME_ROUTE = '/(auth)';
const AUTH_EXPIRED_ROUTE = '/(auth)/sign-in';
type InstantAuthSession = Awaited<ReturnType<typeof db.getAuth>>;
export type InstantAuthStatus =
  | 'loading'
  | 'signed-in'
  | 'guest'
  | 'signed-out';
export type InstantAuthState = {
  status: InstantAuthStatus;
  isReconciled: boolean;
  shouldBlockAuthUi: boolean;
  isSignedInWithClerk: boolean;
  hasInstantGuestSession: boolean;
  hasInstantEmailSession: boolean;
  hasAppAccess: boolean;
  didExpireSignedInSession: boolean;
  isGuestContinuationPending: boolean;
};
type InstantAuthSnapshotArgs = {
  isSignedIn: boolean | undefined;
  instantAuth: InstantAuthSession | undefined;
  isResolvingAuthState: boolean;
  isBlockingAuthLoad: boolean;
  didExpireSignedInSession: boolean;
  isGuestContinuationPending: boolean;
};
type AuthStateListener = () => void;

const instantAuthStateListeners = new Set<AuthStateListener>();
const INITIAL_INSTANT_AUTH_STATE: InstantAuthState = {
  status: 'loading',
  isReconciled: false,
  shouldBlockAuthUi: true,
  isSignedInWithClerk: false,
  hasInstantGuestSession: false,
  hasInstantEmailSession: false,
  hasAppAccess: false,
  didExpireSignedInSession: false,
  isGuestContinuationPending: false,
};
let instantAuthStateSnapshot = INITIAL_INSTANT_AUTH_STATE;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

const subscribeToInstantAuthState = (listener: AuthStateListener) => {
  instantAuthStateListeners.add(listener);

  return () => {
    instantAuthStateListeners.delete(listener);
  };
};

const getInstantAuthStateSnapshot = () => instantAuthStateSnapshot;

const publishInstantAuthStateSnapshot = (snapshot: InstantAuthState) => {
  instantAuthStateSnapshot = snapshot;
  instantAuthStateListeners.forEach(listener => listener());
};

const buildInstantAuthStateSnapshot = ({
  isSignedIn,
  instantAuth,
  isResolvingAuthState,
  isBlockingAuthLoad,
  didExpireSignedInSession,
  isGuestContinuationPending,
}: InstantAuthSnapshotArgs): InstantAuthState => {
  const isReconciled =
    instantAuth !== undefined &&
    isSignedIn !== undefined &&
    !isResolvingAuthState;
  const hasInstantEmailSession = Boolean(instantAuth?.email);
  const hasInstantGuestSession = Boolean(instantAuth && !instantAuth.email);
  const shouldBlockAuthUi =
    isSignedIn === undefined ||
    isBlockingAuthLoad ||
    isResolvingAuthState ||
    instantAuth === undefined ||
    didExpireSignedInSession;

  if (!isReconciled) {
    return {
      ...INITIAL_INSTANT_AUTH_STATE,
      shouldBlockAuthUi,
      didExpireSignedInSession,
      isGuestContinuationPending,
    };
  }

  return {
    status: hasInstantEmailSession
      ? 'signed-in'
      : hasInstantGuestSession
        ? 'guest'
        : 'signed-out',
    isReconciled,
    shouldBlockAuthUi,
    isSignedInWithClerk: Boolean(isSignedIn),
    hasInstantGuestSession,
    hasInstantEmailSession,
    hasAppAccess: hasInstantEmailSession || hasInstantGuestSession,
    didExpireSignedInSession,
    isGuestContinuationPending,
  };
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
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  return useCallback(async () => {
    const existingAuth = await db.getAuth();

    if (existingAuth && !existingAuth.email) {
      await db.auth.signOut();
    }

    await signInWithClerkToken(getTokenRef.current);

    const restoredAuth = await waitForInstantAuthRestore();

    if (!restoredAuth?.email) {
      throw new Error('Instant auth session did not become available in time');
    }
  }, []);
};

export const useInstantAuthState = () =>
  useSyncExternalStore(
    subscribeToInstantAuthState,
    getInstantAuthStateSnapshot,
    getInstantAuthStateSnapshot
  );

type InstantAuthHandlerProps = {
  showBlockingOverlay?: boolean;
  onBlockingAuthLoadChange?: (isBlocking: boolean) => void;
};

export const InstantAuthHandler = ({
  showBlockingOverlay = true,
  onBlockingAuthLoadChange,
}: InstantAuthHandlerProps = {}) => {
  const { isSignedIn, signOut, getToken } = useAuth();
  const signInToInstant = useInstantSignIn();
  const authTransitionRef = useRef(false);
  const previousIsSignedInRef = useRef<boolean | undefined>(isSignedIn);
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const instanceIdRef = useRef(
    `auth-handler-${Math.random().toString(36).slice(2)}`
  );
  const [isAuthController, setIsAuthController] = useState(false);
  const [hasAuthLoadingTimedOut, setHasAuthLoadingTimedOut] = useState(false);
  const [isResolvingAuthState, setIsResolvingAuthState] = useState(true);
  const [didExpireSignedInSession, setDidExpireSignedInSession] =
    useState(false);
  const [resolvedInstantAuth, setResolvedInstantAuth] = useState<
    InstantAuthSession | undefined
  >(undefined);
  const router = useRouter();
  const segments = useSegments();
  const isGuestContinuationPending = useSyncExternalStore(
    subscribeToGuestContinuationState,
    getIsGuestContinuationPending,
    getIsGuestContinuationPending
  );

  const { isLoading: isLoadingInstant, user: liveInstantUser } = db.useAuth();

  const isBlockingAuthLoad = isLoadingInstant && !hasAuthLoadingTimedOut;
  const instantAuthState = useMemo(
    () =>
      buildInstantAuthStateSnapshot({
        isSignedIn,
        instantAuth: resolvedInstantAuth,
        isResolvingAuthState,
        isBlockingAuthLoad,
        didExpireSignedInSession,
        isGuestContinuationPending,
      }),
    [
      didExpireSignedInSession,
      isBlockingAuthLoad,
      isGuestContinuationPending,
      isResolvingAuthState,
      isSignedIn,
      resolvedInstantAuth,
    ]
  );

  useEffect(() => {
    publishInstantAuthStateSnapshot(instantAuthState);
  }, [instantAuthState]);

  useEffect(() => {
    onBlockingAuthLoadChange?.(instantAuthState.shouldBlockAuthUi);
  }, [instantAuthState.shouldBlockAuthUi, onBlockingAuthLoadChange]);

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

    let isCancelled = false;

    const runAuthTransition = async () => {
      let shouldMarkSessionExpired = false;
      let nextResolvedInstantAuth: InstantAuthSession | undefined = null;

      if (!isCancelled) {
        setIsResolvingAuthState(true);
      }

      authTransitionRef.current = true;
      const didTransitionFromSignedIn =
        previousIsSignedInRef.current === true && isSignedIn === false;
      try {
        const existingAuth = await db.getAuth();

        if (isSignedIn) {
          if (existingAuth?.email) {
            let clerkToken: string | null = null;
            let didClerkTokenRefreshFail = false;

            try {
              clerkToken = await getTokenRef.current();
            } catch {
              didClerkTokenRefreshFail = true;
            }

            if (!didClerkTokenRefreshFail && clerkToken) {
              nextResolvedInstantAuth = existingAuth;
              return;
            }

            // Clerk reports signed-in but the token is missing/invalid — the
            // server session has expired. Suppress the follow-up transition
            // toast so we only surface a single "expired" message.
            markManualSignOutIntent();
            await Promise.allSettled([db.auth.signOut(), signOut()]);
            nextResolvedInstantAuth = null;
            shouldMarkSessionExpired = true;
            return;
          }

          try {
            if (existingAuth) {
              await db.auth.signOut();
            }

            await signInToInstant();
            nextResolvedInstantAuth = await waitForInstantAuthRestore();
          } catch {
            await Promise.allSettled([db.auth.signOut(), signOut()]);

            if (!isCancelled) {
              toast.error(
                'Could not restore your session. Please sign in again.'
              );
            }
          }

          return;
        }

        const stableAuth = existingAuth ?? (await waitForInstantAuthRestore());

        if (!stableAuth && isLoadingInstant) {
          nextResolvedInstantAuth = undefined;
          return;
        }

        if (stableAuth?.email) {
          // Clerk is signed-out but Instant still has a cached email session.
          // This is an expired signed-in session regardless of whether we
          // observed the Clerk transition this mount (cold boots after an
          // expiry see undefined -> false, not true -> false).
          const shouldSuppressSignOutToast = consumeManualSignOutIntent();
          await db.auth.signOut();
          nextResolvedInstantAuth = null;

          if (!shouldSuppressSignOutToast) {
            shouldMarkSessionExpired = true;
          }

          return;
        }

        nextResolvedInstantAuth = stableAuth;

        if (!stableAuth && didTransitionFromSignedIn) {
          const shouldSuppressSignOutToast = consumeManualSignOutIntent();

          if (!shouldSuppressSignOutToast) {
            shouldMarkSessionExpired = true;
          }
        }
      } finally {
        authTransitionRef.current = false;
        previousIsSignedInRef.current = isSignedIn;

        if (!isCancelled) {
          setResolvedInstantAuth(nextResolvedInstantAuth);
          setIsResolvingAuthState(false);

          if (shouldMarkSessionExpired) {
            setDidExpireSignedInSession(true);
          }
        }
      }
    };

    void runAuthTransition();

    return () => {
      isCancelled = true;
    };
  }, [
    isSignedIn,
    isLoadingInstant,
    isBlockingAuthLoad,
    isAuthController,
    signInToInstant,
    signOut,
  ]);

  useEffect(() => {
    if (!isAuthController) {
      return;
    }

    if (!instantAuthState.isReconciled || instantAuthState.hasAppAccess) {
      return;
    }

    // Guest continuation (and other in-flight sign-ins) briefly land Instant
    // with a live session before `resolvedInstantAuth` catches up. Don't bounce
    // the user out while the resolver is still behind the live auth.
    if (isGuestContinuationPending || liveInstantUser) {
      return;
    }

    // `(auth)/_layout.tsx` owns the reverse direction (auth -> tabs), so once
    // the user is already inside the auth group we leave routing to it.
    const isOnAuthRoute = segments[0] === '(auth)';

    if (didExpireSignedInSession) {
      toast.info('Your session expired. Please sign in again.');
      setDidExpireSignedInSession(false);

      if (!isOnAuthRoute) {
        router.replace(AUTH_EXPIRED_ROUTE);
      }

      return;
    }

    if (!isOnAuthRoute) {
      router.replace(AUTH_WELCOME_ROUTE);
    }
  }, [
    didExpireSignedInSession,
    instantAuthState.hasAppAccess,
    instantAuthState.isReconciled,
    isAuthController,
    isGuestContinuationPending,
    liveInstantUser,
    router,
    segments,
  ]);

  if (showBlockingOverlay && instantAuthState.shouldBlockAuthUi) {
    return (
      <Animated.View
        exiting={FadeOut.duration(200)}
        pointerEvents="auto"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          elevation: 9999,
        }}
        className="items-center justify-center bg-background"
      >
        <ActivityIndicator />
      </Animated.View>
    );
  }

  return null;
};

export const InstantAuthBlockingOverlay = () => {
  const { shouldBlockAuthUi } = useInstantAuthState();

  if (!shouldBlockAuthUi) {
    return null;
  }

  return (
    <Animated.View
      exiting={FadeOut.duration(400)}
      pointerEvents="auto"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        elevation: 9999,
      }}
      className="items-center justify-center bg-background"
    >
      <ActivityIndicator />
    </Animated.View>
  );
};
