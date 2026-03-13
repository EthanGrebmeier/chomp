import { useCallback } from 'react';

import { db } from '.';

const GUEST_AUTH_RETRY_COUNT = 10;
const GUEST_AUTH_RETRY_DELAY_MS = 100;

const waitForGuestAuth = async () => {
  for (let attempt = 0; attempt < GUEST_AUTH_RETRY_COUNT; attempt += 1) {
    const auth = await db.getAuth();

    if (auth && !auth.email) {
      return auth;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, GUEST_AUTH_RETRY_DELAY_MS)
    );
  }

  throw new Error('Guest auth session did not become available in time');
};

export const useContinueAsGuest = () => {
  return useCallback(async () => {
    const existingAuth = await db.getAuth();

    if (existingAuth?.email) {
      await db.auth.signOut();
    }

    if (!existingAuth || existingAuth.email) {
      await db.auth.signInAsGuest();
    }

    await waitForGuestAuth();
  }, []);
};
