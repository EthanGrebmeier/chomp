import { useCallback } from 'react';

import { initializeDefaultGroceryList } from '@/features/grocery-lists/instant/useInitializeDefaultGroceryList';

import { db } from '.';

const GUEST_AUTH_RETRY_COUNT = 10;
const GUEST_AUTH_RETRY_DELAY_MS = 100;
type GuestContinuationListener = (isPending: boolean) => void;

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

    if (auth && !auth.email) {
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

    try {
      const existingAuth = await db.getAuth();

      if (existingAuth?.email) {
        await db.auth.signOut();
      }

      if (!existingAuth || existingAuth.email) {
        await db.auth.signInAsGuest();
      }

      await waitForGuestAuth();
      return await initializeDefaultGroceryList();
    } finally {
      setIsGuestContinuationPending(false);
    }
  }, []);
};
