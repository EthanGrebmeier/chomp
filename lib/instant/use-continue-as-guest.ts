import { useCallback } from 'react';

import { initializeDefaultGroceryList } from '@/features/grocery-lists/instant/useInitializeDefaultGroceryList';

import { db } from '.';

const GUEST_AUTH_RETRY_COUNT = 20;
const GUEST_AUTH_RETRY_DELAY_MS = 250;
type GuestContinuationListener = (isPending: boolean) => void;

const describeAuth = (auth: Awaited<ReturnType<typeof db.getAuth>>) => {
  if (!auth) {
    return { status: 'none' };
  }

  return {
    status: auth.email ? 'email-session' : 'guest-session',
    id: auth.id,
    hasEmail: Boolean(auth.email),
  };
};

const logGuestContinuation = (message: string, data?: unknown) => {
  console.info(`[guest-continuation] ${message}`, data ?? '');
};

const guestContinuationListeners = new Set<GuestContinuationListener>();
let isGuestContinuationPending = false;

const setIsGuestContinuationPending = (isPending: boolean) => {
  if (isGuestContinuationPending === isPending) {
    return;
  }

  isGuestContinuationPending = isPending;
  guestContinuationListeners.forEach((listener) => listener(isPending));
};

export const subscribeToGuestContinuationState = (
  listener: GuestContinuationListener
) => {
  guestContinuationListeners.add(listener);

  return () => {
    guestContinuationListeners.delete(listener);
  };
};

export const getIsGuestContinuationPending = () => isGuestContinuationPending;

const waitForGuestAuth = async () => {
  for (let attempt = 0; attempt < GUEST_AUTH_RETRY_COUNT; attempt += 1) {
    const auth = await db.getAuth();
    logGuestContinuation('waitForGuestAuth attempt', {
      attempt: attempt + 1,
      auth: describeAuth(auth),
    });

    if (auth && !auth.email) {
      logGuestContinuation('guest auth became available', describeAuth(auth));
      return auth;
    }

    await new Promise(resolve =>
      setTimeout(resolve, GUEST_AUTH_RETRY_DELAY_MS)
    );
  }

  throw new Error('Guest auth session did not become available in time');
};

export const useContinueAsGuest = () => {
  return useCallback(async () => {
    setIsGuestContinuationPending(true);
    logGuestContinuation('started');

    try {
      const existingAuth = await db.getAuth();
      logGuestContinuation('existing auth loaded', describeAuth(existingAuth));

      if (existingAuth?.email) {
        logGuestContinuation('signing out existing email session');
        await db.auth.signOut();
      }

      if (!existingAuth || existingAuth.email) {
        logGuestContinuation('calling signInAsGuest');
        await db.auth.signInAsGuest();
        logGuestContinuation('signInAsGuest resolved');
      }

      await waitForGuestAuth();
      const listId = await initializeDefaultGroceryList();
      logGuestContinuation('default list initialization resolved', { listId });
      return listId;
    } catch (error) {
      console.error('[guest-continuation] failed', error);
      throw error;
    } finally {
      logGuestContinuation('finished');
      setIsGuestContinuationPending(false);
    }
  }, []);
};
