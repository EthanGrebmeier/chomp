import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { resourceCache } from '@clerk/clerk-expo/resource-cache';
import { PortalHost } from '@rn-primitives/portal';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-get-random-values';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Toaster } from 'sonner-native';

import { tokenCache } from '@/lib/clerk-token-cache';
import { MigrationProvider } from '@/providers/migration-provider';
import { QueryClientProvider } from '@/providers/query-client-provider';

import '../global.css';

const db = SQLite.openDatabaseSync('db.db');

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env'
  );
}

function InitialLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isSignedIn && inAuthGroup) {
      // User is signed in but on an auth screen, redirect to main app
      router.replace('/(tabs)');
    } else if (!isSignedIn && !inAuthGroup) {
      // User is not signed in and not on an auth screen, redirect to sign in
      router.replace('/(auth)/sign-in-email');
    }
  }, [isSignedIn, isLoaded, segments, router]);

  return (
    <View className="flex-1 bg-background">
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
      </Stack>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: 100,
          },
        }}
      />
    </View>
  );
}

export default function RootLayout() {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useDrizzleStudio(db);
  }
  return (
    <ClerkProvider
      __experimental_resourceCache={resourceCache}
      tokenCache={tokenCache}
      publishableKey={publishableKey}
    >
      <ClerkLoaded>
        <QueryClientProvider>
          <KeyboardProvider>
            <MigrationProvider>
              <GestureHandlerRootView>
                <InitialLayout />
                <PortalHost />
              </GestureHandlerRootView>
            </MigrationProvider>
          </KeyboardProvider>
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
