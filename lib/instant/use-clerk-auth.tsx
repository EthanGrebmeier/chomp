import { useAuth } from '@clerk/clerk-expo';
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { db } from '.';

export const InstantAuthHandler = () => {
  const { getToken } = useAuth();

  const {
    isLoading: isLoadingInstant,
    error: errorInstant,
    user: userInstant,
  } = db.useAuth();

  const signInToInstant = async () => {
    // getToken gets the jwt from Clerk for your signed in user.
    const idToken = await getToken();

    if (!idToken) {
      // No jwt, can't sign in to instant
      await db.auth.signInAsGuest();
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
    if (isLoadingInstant || userInstant || errorInstant) {
      return;
    }

    signInToInstant();
  }, []);

  if (isLoadingInstant) {
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
