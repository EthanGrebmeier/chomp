import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useRef } from 'react';

import { initializeSavedItems } from '../../features/saved-items/instant/initialize-saved-items';

import { db } from '.';

export const InstantClerkAuth = () => {
  const { getToken } = useAuth();
  const { user } = db.useAuth();
  const initializationAttemptedRef = useRef(false);

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

  // Initialize saved items for new users
  useEffect(() => {
    const initializeSavedItemsForUser = async () => {
      if (!user || initializationAttemptedRef.current) {
        return;
      }

      initializationAttemptedRef.current = true;

      // Query the user to check if they've already been initialized
      const { data } = await db.queryOnce({
        $users: {
          $: {
            where: {
              id: user.id,
            },
          },
        },
      });

      const currentUser = data?.$users?.[0];

      // If user hasn't initialized saved items yet, do it now
      if (currentUser && !currentUser.hasInitializedSavedItems) {
        try {
          await initializeSavedItems(user.id);
        } catch (error) {
          console.error('Failed to initialize saved items:', error);
        }
      }
    };

    initializeSavedItemsForUser();
  }, [user]);

  return null;
};
