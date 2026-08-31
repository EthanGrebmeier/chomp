import { useAuth, useUser } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import { useRouter, useSegments } from 'expo-router';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { toast } from 'sonner-native';

import { useNetworkStatus } from '@/hooks/use-network-status';
import { useTheme } from '@/hooks/use-theme';

import { consumeManualSignOutIntent } from '../clerk/signout-intent';

import { createInstantAuthBridge, InstantBridgeError } from './auth-bridge';
import {
  doesInstantAuthMatchClerk,
  getAuthReconciliationAction,
  shouldStartClerkSignOutGracePeriod,
} from './auth-reconciliation';
import { redirectSignedOutAuth } from './auth-redirect';
import {
  getIsEmailAuthCompletionActive,
  subscribeToEmailAuthCompletionState,
} from './email-auth-completion';
import {
  getIsGuestContinuationPending,
  subscribeToGuestContinuationState,
} from './use-continue-as-guest';

import { db } from '.';

export { runWithEmailAuthCompletion } from './email-auth-completion';
export { InstantBridgeError } from './auth-bridge';

const AUTH_LOADING_TIMEOUT_MS = 4000;
const AUTH_RESTORE_RETRY_COUNT = 10;
const AUTH_RESTORE_RETRY_DELAY_MS = 250;
const CLERK_SIGN_OUT_GRACE_PERIOD_MS = 3000;
const AUTH_WELCOME_ROUTE: Href = '/(auth)';
const AUTH_EXPIRED_ROUTE: Href = AUTH_WELCOME_ROUTE;
const BRIDGE_BACKGROUND_RETRY_COUNT = 3;
const BRIDGE_BACKGROUND_RETRY_BASE_DELAY_MS = 1500;
type InstantAuthSession = Awaited<ReturnType<typeof db.getAuth>>;
export type InstantAuthStatus =
  | 'loading'
  | 'signed-in'
  | 'guest'
  | 'bridge-error'
  | 'signed-out';
export type InstantBridgeStatus = 'idle' | 'pending' | 'error';
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
  bridgeStatus: InstantBridgeStatus;
};
type InstantAuthSnapshotArgs = {
  isClerkLoaded: boolean;
  isSignedIn: boolean | undefined;
  instantAuth: InstantAuthSession | undefined;
  isResolvingAuthState: boolean;
  isBlockingAuthLoad: boolean;
  didExpireSignedInSession: boolean;
  isGuestContinuationPending: boolean;
  bridgeStatus: InstantBridgeStatus;
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
  bridgeStatus: 'idle',
};
let instantAuthStateSnapshot = INITIAL_INSTANT_AUTH_STATE;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const logBridge = (message: string, payload?: unknown) => {
  if (payload === undefined) {
    // eslint-disable-next-line no-console
    console.log(`[instant-bridge] ${message}`);
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`[instant-bridge] ${message}`, payload);
};

const waitForInstantAuthRestore = async (
  isExpectedAuth?: (auth: NonNullable<InstantAuthSession>) => boolean
) => {
  for (let attempt = 0; attempt < AUTH_RESTORE_RETRY_COUNT; attempt += 1) {
    const auth = await db.getAuth();

    if (auth && (!isExpectedAuth || isExpectedAuth(auth))) {
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
  isClerkLoaded,
  isSignedIn,
  instantAuth,
  isResolvingAuthState,
  isBlockingAuthLoad,
  didExpireSignedInSession,
  isGuestContinuationPending,
  bridgeStatus,
}: InstantAuthSnapshotArgs): InstantAuthState => {
  const isReconciled =
    isClerkLoaded &&
    instantAuth !== undefined &&
    isSignedIn !== undefined &&
    !isResolvingAuthState &&
    bridgeStatus !== 'pending';
  const hasInstantEmailSession = Boolean(instantAuth?.email);
  const hasInstantGuestSession = Boolean(instantAuth && !instantAuth.email);
  const shouldBlockAuthUi =
    !isClerkLoaded ||
    isSignedIn === undefined ||
    isBlockingAuthLoad ||
    isResolvingAuthState ||
    instantAuth === undefined ||
    didExpireSignedInSession ||
    bridgeStatus === 'pending';

  if (!isReconciled) {
    return {
      ...INITIAL_INSTANT_AUTH_STATE,
      shouldBlockAuthUi,
      didExpireSignedInSession,
      isGuestContinuationPending,
      bridgeStatus,
    };
  }

  return {
    status:
      bridgeStatus === 'error'
        ? 'bridge-error'
        : hasInstantEmailSession
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
    bridgeStatus,
  };
};

const bridgeClerkToInstant = createInstantAuthBridge({
  signInWithIdToken: async idToken => {
    await db.auth.signInWithIdToken({
      clientName: process.env.EXPO_PUBLIC_INSTANT_CLIENT_NAME!,
      idToken,
    });
  },
  onAttemptFailed: ({ attempt, canRetry, error }) => {
    logBridge('bridge attempt failed', {
      attempt,
      canRetry,
      error: error instanceof Error ? error.message : error,
    });
  },
});

export const useInstantSignIn = () => {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  return useCallback(async () => {
    await bridgeClerkToInstant(getTokenRef.current);
    const restoredAuth = await waitForInstantAuthRestore();

    if (!restoredAuth?.email) {
      throw new InstantBridgeError(
        'Instant did not restore the bridged Clerk session',
        { isTimeout: true }
      );
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
  const {
    isLoaded: isClerkLoaded,
    isSignedIn,
    userId: clerkUserId,
  } = useAuth({ treatPendingAsSignedOut: false });
  const { user: clerkUser } = useUser();
  const signInToInstant = useInstantSignIn();
  const previousIsSignedInRef = useRef<boolean | undefined>(isSignedIn);
  const hasClerkSignOutGraceElapsedRef = useRef(false);
  const transitionIdRef = useRef(0);
  const previousAppStateRef = useRef(AppState.currentState);
  const [hasAuthLoadingTimedOut, setHasAuthLoadingTimedOut] = useState(false);
  const [isResolvingAuthState, setIsResolvingAuthState] = useState(true);
  const [didExpireSignedInSession, setDidExpireSignedInSession] =
    useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<InstantBridgeStatus>('idle');
  const [bridgeRetryAttempt, setBridgeRetryAttempt] = useState(0);
  const [reconcileNonce, setReconcileNonce] = useState(0);
  const [resumeNonce, setResumeNonce] = useState(0);
  const [resolvedInstantAuth, setResolvedInstantAuth] = useState<
    InstantAuthSession | undefined
  >(undefined);
  const router = useRouter();
  const queryClient = useQueryClient();
  const segments = useSegments();
  const theme = useTheme();
  const { isOffline } = useNetworkStatus();
  const clerkEmail = clerkUser?.primaryEmailAddress?.emailAddress ?? null;
  const isGuestContinuationPending = useSyncExternalStore(
    subscribeToGuestContinuationState,
    getIsGuestContinuationPending,
    getIsGuestContinuationPending
  );
  const isEmailAuthCompletionActive = useSyncExternalStore(
    subscribeToEmailAuthCompletionState,
    getIsEmailAuthCompletionActive,
    getIsEmailAuthCompletionActive
  );

  const { isLoading: isLoadingInstant, user: liveInstantUser } = db.useAuth();

  const isBlockingAuthLoad = isLoadingInstant && !hasAuthLoadingTimedOut;
  const liveGuestInstantAuth =
    !isSignedIn &&
    !isLoadingInstant &&
    liveInstantUser &&
    !liveInstantUser.email
      ? (liveInstantUser as InstantAuthSession)
      : undefined;
  const instantAuthState = useMemo(
    () =>
      buildInstantAuthStateSnapshot({
        isClerkLoaded,
        isSignedIn,
        instantAuth: liveGuestInstantAuth ?? resolvedInstantAuth,
        isResolvingAuthState: liveGuestInstantAuth
          ? false
          : isResolvingAuthState || isEmailAuthCompletionActive,
        isBlockingAuthLoad,
        didExpireSignedInSession: liveGuestInstantAuth
          ? false
          : didExpireSignedInSession,
        isGuestContinuationPending,
        bridgeStatus: liveGuestInstantAuth ? 'idle' : bridgeStatus,
      }),
    [
      bridgeStatus,
      didExpireSignedInSession,
      isBlockingAuthLoad,
      isClerkLoaded,
      isGuestContinuationPending,
      isEmailAuthCompletionActive,
      isResolvingAuthState,
      isSignedIn,
      liveGuestInstantAuth,
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
      queueMicrotask(() => setHasAuthLoadingTimedOut(false));
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
    const subscription = AppState.addEventListener('change', nextState => {
      const previousState = previousAppStateRef.current;
      previousAppStateRef.current = nextState;

      if (nextState === 'active' && previousState !== 'active') {
        setResumeNonce(current => current + 1);
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    hasClerkSignOutGraceElapsedRef.current = false;

    if (
      !shouldStartClerkSignOutGracePeriod({
        isClerkLoaded,
        isSignedIn,
        isOffline,
      })
    ) {
      return;
    }

    const timeout = setTimeout(() => {
      hasClerkSignOutGraceElapsedRef.current = true;
      setReconcileNonce(current => current + 1);
    }, CLERK_SIGN_OUT_GRACE_PERIOD_MS);

    return () => clearTimeout(timeout);
  }, [isClerkLoaded, isOffline, isSignedIn]);

  useEffect(() => {
    const transitionId = ++transitionIdRef.current;

    if (!isClerkLoaded || isSignedIn === undefined || isBlockingAuthLoad) {
      return;
    }

    if (isEmailAuthCompletionActive) {
      return;
    }

    const runAuthTransition = async () => {
      let shouldMarkSessionExpired = false;
      let nextResolvedInstantAuth: InstantAuthSession | undefined = null;
      let nextBridgeStatus: InstantBridgeStatus = 'idle';

      setIsResolvingAuthState(true);
      const didTransitionFromSignedIn =
        previousIsSignedInRef.current === true && isSignedIn === false;

      try {
        if (didTransitionFromSignedIn) {
          queryClient.clear();
        }

        const existingAuth = await db.getAuth();
        const stableAuth =
          existingAuth ??
          (isLoadingInstant ? await waitForInstantAuthRestore() : null);

        if (transitionId !== transitionIdRef.current) {
          return;
        }

        const action = getAuthReconciliationAction({
          isClerkLoaded,
          isSignedIn,
          clerkUserId: clerkUserId ?? null,
          clerkEmail,
          instantAuth: stableAuth,
          hasClerkSignOutGraceElapsed:
            hasClerkSignOutGraceElapsedRef.current,
        });

        if (action === 'wait') {
          nextResolvedInstantAuth = undefined;
          return;
        }

        if (
          action === 'keep-email-session' ||
          action === 'keep-guest-session'
        ) {
          nextResolvedInstantAuth = stableAuth;
          setBridgeRetryAttempt(0);
          return;
        }

        if (action === 'bridge-clerk-session') {
          nextBridgeStatus = 'pending';
          setBridgeStatus('pending');

          try {
            await signInToInstant();
            const restoredAuth = await waitForInstantAuthRestore(auth =>
              doesInstantAuthMatchClerk({
                clerkEmail,
                clerkUserId: clerkUserId ?? null,
                instantAuth: auth,
              })
            );

            if (!restoredAuth?.email) {
              throw new InstantBridgeError(
                'Instant did not restore the bridged Clerk session',
                { isTimeout: true }
              );
            }

            if (stableAuth && stableAuth.id !== restoredAuth.id) {
              queryClient.clear();
            }

            nextResolvedInstantAuth = restoredAuth;
            nextBridgeStatus = 'idle';
            setBridgeRetryAttempt(0);
          } catch (error) {
            nextResolvedInstantAuth = null;
            nextBridgeStatus = 'error';
            setBridgeRetryAttempt(current => current + 1);
            logBridge('preserving Clerk session after bridge failure', {
              error: error instanceof Error ? error.message : error,
              isOffline,
            });
          }

          return;
        }

        if (action === 'clear-instant-session') {
          const shouldSuppressSignOutToast = consumeManualSignOutIntent();
          queryClient.clear();
          await db.auth.signOut();
          nextResolvedInstantAuth = null;

          if (!shouldSuppressSignOutToast) {
            shouldMarkSessionExpired = true;
          }

          return;
        }

        nextResolvedInstantAuth = null;

        if (didTransitionFromSignedIn) {
          const shouldSuppressSignOutToast = consumeManualSignOutIntent();

          if (!shouldSuppressSignOutToast) {
            shouldMarkSessionExpired = true;
          }
        }
      } finally {
        if (transitionId === transitionIdRef.current) {
          previousIsSignedInRef.current = isSignedIn;
          setResolvedInstantAuth(nextResolvedInstantAuth);
          setBridgeStatus(nextBridgeStatus);
          setIsResolvingAuthState(false);

          if (shouldMarkSessionExpired) {
            setDidExpireSignedInSession(true);
          }
        }
      }
    };

    void runAuthTransition();
  }, [
    clerkEmail,
    clerkUserId,
    isBlockingAuthLoad,
    isClerkLoaded,
    isEmailAuthCompletionActive,
    isLoadingInstant,
    isOffline,
    isSignedIn,
    queryClient,
    reconcileNonce,
    resumeNonce,
    signInToInstant,
  ]);

  useEffect(() => {
    if (
      bridgeStatus !== 'error' ||
      bridgeRetryAttempt >= BRIDGE_BACKGROUND_RETRY_COUNT ||
      isOffline
    ) {
      return;
    }

    const timeout = setTimeout(
      () => setReconcileNonce(current => current + 1),
      BRIDGE_BACKGROUND_RETRY_BASE_DELAY_MS * Math.max(1, bridgeRetryAttempt)
    );

    return () => clearTimeout(timeout);
  }, [bridgeRetryAttempt, bridgeStatus, isOffline]);

  useEffect(() => {
    if (
      !instantAuthState.isReconciled ||
      instantAuthState.hasAppAccess ||
      instantAuthState.isSignedInWithClerk ||
      instantAuthState.bridgeStatus !== 'idle'
    ) {
      return;
    }

    if (isGuestContinuationPending || liveInstantUser) {
      return;
    }

    // `(auth)/_layout.tsx` owns the reverse direction (auth -> tabs), so once
    // the user is already inside the auth group we leave routing to it.
    const isOnAuthRoute = segments[0] === '(auth)';

    if (didExpireSignedInSession) {
      toast.info('Your session expired. Please sign in again.');
      queueMicrotask(() => setDidExpireSignedInSession(false));

      redirectSignedOutAuth({
        isOnAuthRoute,
        router,
        target: AUTH_EXPIRED_ROUTE,
      });

      return;
    }

    redirectSignedOutAuth({
      isOnAuthRoute,
      router,
      target: AUTH_WELCOME_ROUTE,
    });
  }, [
    didExpireSignedInSession,
    instantAuthState.hasAppAccess,
    instantAuthState.bridgeStatus,
    instantAuthState.isReconciled,
    instantAuthState.isSignedInWithClerk,
    isGuestContinuationPending,
    liveInstantUser,
    router,
    segments,
  ]);

  const retryBridge = () => {
    setBridgeRetryAttempt(0);
    setBridgeStatus('pending');
    setReconcileNonce(current => current + 1);
  };

  if (!showBlockingOverlay) {
    return null;
  }

  if (
    instantAuthState.bridgeStatus === 'error' &&
    instantAuthState.isSignedInWithClerk
  ) {
    return (
      <View style={[styles.overlay, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.foreground }]}>
          Reconnecting your account
        </Text>
        <Text style={[styles.message, { color: theme.mutedForeground }]}>
          Your sign-in is safe. Check your connection and try again.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={retryBridge}
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
        >
          <Text style={[styles.retryText, { color: theme.primaryForeground }]}>
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }

  if (instantAuthState.shouldBlockAuthUi) {
    return (
      <View style={[styles.overlay, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    zIndex: 1000,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 320,
  },
  retryButton: {
    marginTop: 8,
    minHeight: 48,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderCurve: 'continuous',
    paddingHorizontal: 24,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
