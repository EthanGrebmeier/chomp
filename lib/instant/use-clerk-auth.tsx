import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { toast } from 'sonner-native';

import { consumeManualSignOutIntent } from '../clerk/signout-intent';

import {
  getIsGuestContinuationPending,
  subscribeToGuestContinuationState,
} from './use-continue-as-guest';

import { db } from '.';

let activeAuthControllerId: string | null = null;
const AUTH_LOADING_TIMEOUT_MS = 4000;
const AUTH_RESTORE_RETRY_COUNT = 10;
const AUTH_RESTORE_RETRY_DELAY_MS = 250;
const AUTH_ENTRY_ROUTE = '/(auth)';
type InstantAuthSession = Awaited<ReturnType<typeof db.getAuth>>;
export type InstantAuthStatus = 'loading' | 'signed-in' | 'guest' | 'signed-out';
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
    instantAuth !== undefined && isSignedIn !== undefined && !isResolvingAuthState;
  const hasInstantEmailSession = Boolean(instantAuth?.email);
  const hasInstantGuestSession = Boolean(instantAuth && !instantAuth.email);
  const shouldBlockAuthUi =
    isSignedIn === undefined || isBlockingAuthLoad || isResolvingAuthState;

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

  return useCallback(async () => {
    const existingAuth = await db.getAuth();

    if (existingAuth && !existingAuth.email) {
      await db.auth.signOut();
    }

    await signInWithClerkToken(getToken);

    const restoredAuth = await waitForInstantAuthRestore();

    if (!restoredAuth?.email) {
      throw new Error('Instant auth session did not become available in time');
    }
  }, [getToken]);
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
  const { isSignedIn, signOut } = useAuth();
  const signInToInstant = useInstantSignIn();
  const authTransitionRef = useRef(false);
  const previousIsSignedInRef = useRef<boolean | undefined>(isSignedIn);
  const instanceIdRef = useRef(
    `auth-handler-${Math.random().toString(36).slice(2)}`
  );
  const [isAuthController, setIsAuthController] = useState(false);
  const [hasAuthLoadingTimedOut, setHasAuthLoadingTimedOut] = useState(false);
  const [isResolvingAuthState, setIsResolvingAuthState] = useState(true);
  const [didExpireSignedInSession, setDidExpireSignedInSession] = useState(false);
  const [resolvedInstantAuth, setResolvedInstantAuth] = useState<
    InstantAuthSession | undefined
  >(undefined);
  const router = useRouter();
  const isGuestContinuationPending = useSyncExternalStore(
    subscribeToGuestContinuationState,
    getIsGuestContinuationPending,
    getIsGuestContinuationPending
  );

  const { isLoading: isLoadingInstant } = db.useAuth();

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
      const shouldSuppressSignOutToast = didTransitionFromSignedIn
        ? consumeManualSignOutIntent()
        : false;
      try {
        const existingAuth = await db.getAuth();

        if (isSignedIn) {
          if (existingAuth?.email) {
            nextResolvedInstantAuth = existingAuth;
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
              toast.error('Could not restore your session. Please sign in again.');
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
          await db.auth.signOut();
          nextResolvedInstantAuth = null;

          if (didTransitionFromSignedIn && !shouldSuppressSignOutToast) {
            shouldMarkSessionExpired = true;
          }

          return;
        }

        nextResolvedInstantAuth = stableAuth;

        if (!stableAuth && didTransitionFromSignedIn && !shouldSuppressSignOutToast) {
          shouldMarkSessionExpired = true;
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
    if (!didExpireSignedInSession || !isAuthController) {
      return;
    }

    toast.info('Your session expired. Please sign in again.');
    router.replace(AUTH_ENTRY_ROUTE);
    setDidExpireSignedInSession(false);
  }, [didExpireSignedInSession, isAuthController, router]);

  if (showBlockingOverlay && instantAuthState.shouldBlockAuthUi) {
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
