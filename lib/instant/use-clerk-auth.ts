import { useAuth } from '@clerk/clerk-expo';
import { useEffect } from 'react';

import { db } from '.';

export const InstantClerkAuth = () => {
  const { getToken } = useAuth();

  const signInToInstantWithClerkToken = async () => {
    // getToken gets the jwt from Clerk for your signed in user.
    const idToken = await getToken();

    if (!idToken) {
      // No jwt, can't sign in to instant
      return;
    }

    // Create a long-lived session with Instant for your clerk user
    // It will look up the user by email or create a new user with
    // the email address in the session token.
    db.auth.signInWithIdToken({
      clientName: process.env.EXPO_PUBLIC_INSTANT_CLIENT_NAME!,
      idToken: idToken,
    });
  };

  useEffect(() => {
    signInToInstantWithClerkToken();
  }, []);

  return null;
};
