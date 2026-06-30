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
import { toast } from 'sonner-native';

import {
  consumeManualSignOutIntent,
  markManualSignOutIntent,
} from '../clerk/signout-intent';

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

let activeAuthControllerId: string | null = null;
const AUTH_LOADING_TIMEOUT_MS = 4000;
const AUTH_RESTORE_RETRY_COUNT = 10;
const AUTH_RESTORE_RETRY_DELAY_MS = 250;
const AUTH_WELCOME_ROUTE: Href = '/(auth)';
const AUTH_EXPIRED_ROUTE: Href = AUTH_WELCOME_ROUTE;
const BRIDGE_STEP_TIMEOUT_MS = 15000;
const BRIDGE_RETRY_COUNT = 3;
const BRIDGE_RETRY_BASE_DELAY_MS = 750;
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

/**
 * Thrown when the Clerk -> Instant bridge fails but the Clerk session is still
 * valid. Callers should keep the Clerk session (so `InstantAuthHandler` can
 * retry the bridge) instead of signing the user out.
 */
export class InstantBridgeError extends Error {
  readonly isTimeout: boolean;
  readonly cause?: unknown;

  constructor(message: string, options?: { isTimeout?: boolean; cause?: unknown }) {
    super(message);
    this.name = 'InstantBridgeError';
    this.isTimeout = options?.isTimeout ?? false;
    this.cause = options?.cause;
  }
}

const logBridge = (message: string, payload?: unknown) => {
  if (payload === undefined) {
    // eslint-disable-next-line no-console
    console.log(`[instant-bridge] ${message}`);
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`[instant-bridge] ${message}`, payload);
};

class BridgeTimeoutError extends Error {
  constructor(step: string, timeoutMs: number) {
    super(`Instant bridge step "${step}" timed out after ${timeoutMs}ms`);
    this.name = 'BridgeTimeoutError';
  }
}

const withTimeout = async <T,>(
  step: string,
  timeoutMs: number,
  task: () => Promise<T>
): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      task(),
      new Promise<never>((_resolve, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new BridgeTimeoutError(step, timeoutMs));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

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

const isTimeoutLikeError = (error: unknown) => {
  if (error instanceof BridgeTimeoutError) {
    return true;
  }

  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : '';

  return /timed out|timeout|network|fetch failed/i.test(message);
};

const signInWithClerkToken = async (getToken: () => Promise<string | null>) => {
  const idToken = await withTimeout('clerk.getToken', BRIDGE_STEP_TIMEOUT_MS, () =>
    getToken()
  );

  if (!idToken) {
    throw new Error('Missing Clerk ID token');
  }

  await withTimeout('instant.signInWithIdToken', BRIDGE_STEP_TIMEOUT_MS, () =>
    db.auth.signInWithIdToken({
      clientName: process.env.EXPO_PUBLIC_INSTANT_CLIENT_NAME!,
      idToken,
    })
  );
};

const bridgeClerkToInstant = async (getToken: () => Promise<string | null>) => {
  const existingAuth = await db.getAuth();

  if (existingAuth) {
    await db.auth.signOut();
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= BRIDGE_RETRY_COUNT; attempt += 1) {
    try {
      await signInWithClerkToken(getToken);

      const restoredAuth = await waitForInstantAuthRestore();

      if (!restoredAuth?.email) {
        throw new BridgeTimeoutError('instant.authRestore', BRIDGE_STEP_TIMEOUT_MS);
      }

      return;
    } catch (error) {
      lastError = error;
      const canRetry = attempt < BRIDGE_RETRY_COUNT && isTimeoutLikeError(error);

      logBridge('bridge attempt failed', {
        attempt,
        canRetry,
        error: error instanceof Error ? error.message : error,
      });

      if (!canRetry) {
        break;
      }

      await sleep(BRIDGE_RETRY_BASE_DELAY_MS * attempt);
    }
  }

  throw new InstantBridgeError('Clerk to Instant bridge failed', {
    isTimeout: isTimeoutLikeError(lastError),
    cause: lastError,
  });
};

export const useInstantSignIn = () => {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  return useCallback(async () => {
    await bridgeClerkToInstant(getTokenRef.current);
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
  const { isSignedIn, signOut, getToken, userId: clerkUserId } = useAuth();
  const { user: clerkUser } = useUser();
  const signInToInstant = useInstantSignIn();
  const authTransitionRef = useRef(false);
  const previousIsSignedInRef = useRef<boolean | undefined>(isSignedIn);
  const getTokenRef = useRef(getToken);
  const pendingAuthRedirectTargetRef = useRef<Href | null>(null);
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
  const queryClient = useQueryClient();
  const segments = useSegments();
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
        isSignedIn,
        instantAuth: liveGuestInstantAuth ?? resolvedInstantAuth,
        isResolvingAuthState: liveGuestInstantAuth
          ? false
          : isResolvingAuthState,
        isBlockingAuthLoad,
        didExpireSignedInSession: liveGuestInstantAuth
          ? false
          : didExpireSignedInSession,
        isGuestContinuationPending,
      }),
    [
      didExpireSignedInSession,
      isBlockingAuthLoad,
      isGuestContinuationPending,
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

    if (isEmailAuthCompletionActive) {
      setIsResolvingAuthState(true);
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
        if (didTransitionFromSignedIn) {
          queryClient.clear();
        }

        const existingAuth = await db.getAuth();

        if (isSignedIn) {
          if (existingAuth?.email) {
            const matchesCurrentClerkUser =
              (!!clerkUserId && existingAuth.id === clerkUserId) ||
              (!!clerkEmail && existingAuth.email === clerkEmail);

            if (!matchesCurrentClerkUser) {
              queryClient.clear();
              await db.auth.signOut();
              await signInToInstant();
              nextResolvedInstantAuth = await waitForInstantAuthRestore();
              return;
            }

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
            queryClient.clear();
            await Promise.allSettled([db.auth.signOut(), signOut()]);
            nextResolvedInstantAuth = null;
            shouldMarkSessionExpired = true;
            return;
          }

          try {
            if (existingAuth) {
              queryClient.clear();
              await db.auth.signOut();
            }

            await signInToInstant();
            nextResolvedInstantAuth = await waitForInstantAuthRestore();
          } catch (error) {
            // Transient network failure: keep the Clerk session intact so the
            // in-flight sign-in screen (or the next transition) can retry the
            // bridge without forcing the user to re-authenticate.
            if (error instanceof InstantBridgeError && error.isTimeout) {
              nextResolvedInstantAuth = null;
              return;
            }

            queryClient.clear();
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
          queryClient.clear();
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
    isEmailAuthCompletionActive,
    isAuthController,
    clerkEmail,
    clerkUserId,
    queryClient,
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

      redirectSignedOutAuth({
        isOnAuthRoute,
        pendingTargetRef: pendingAuthRedirectTargetRef,
        router,
        target: AUTH_EXPIRED_ROUTE,
      });

      return;
    }

    redirectSignedOutAuth({
      isOnAuthRoute,
      pendingTargetRef: pendingAuthRedirectTargetRef,
      router,
      target: AUTH_WELCOME_ROUTE,
    });
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

  return null;
};
