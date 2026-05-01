import { ClerkProvider } from '@clerk/clerk-expo';
import { resourceCache } from '@clerk/clerk-expo/resource-cache';
import { AveriaSerifLibre_400Regular } from '@expo-google-fonts/averia-serif-libre';
import { Jaro_400Regular } from '@expo-google-fonts/jaro';
import { PortalHost } from '@rn-primitives/portal';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SQLite from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-get-random-values';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import {
  ReanimatedLogLevel,
  configureReanimatedLogger,
} from 'react-native-reanimated';
import { Toaster } from 'sonner-native';

import { tokenCache } from '@/lib/clerk-token-cache';
import {
  InstantAuthBlockingOverlay,
  InstantAuthHandler,
} from '@/lib/instant/use-clerk-auth';
import { MigrationProvider } from '@/providers/migration-provider';
import { QueryClientProvider } from '@/providers/query-client-provider';

import '../global.css';
import { useTheme } from '../hooks/use-theme';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});
void SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore if splash is already controlled elsewhere.
});

const db = SQLite.openDatabaseSync('db.db');
const SPLASH_MAX_BLOCK_MS = 6000;

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env'
  );
}

function InitialLayout() {
  const theme = useTheme();

  return (
    <View className="flex-1 bg-background">
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="meal-plan/[listId]"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [1],
            sheetInitialDetentIndex: 0,
            contentStyle: {
              height: '100%',
              backgroundColor: theme.background,
            },
          }}
        />
        <Stack.Screen
          name="recipes"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [1],
            sheetInitialDetentIndex: 0,
            contentStyle: {
              height: '100%',
              backgroundColor: theme.background,
            },
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: 'fitToContents',
            sheetInitialDetentIndex: 0,
            contentStyle: {
              backgroundColor: theme.background,
            },
          }}
        />
      </Stack>
      <Toaster
        position="top-center"
        duration={2000}
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
  const [fontsLoaded, fontLoadError] = useFonts({
    'averia-serif-libre': AveriaSerifLibre_400Regular,
    'jaro-regular': Jaro_400Regular,
    'alpino-regular': require('../assets/fonts/alpino/Alpino-Regular.otf'),
    'alpino-medium': require('../assets/fonts/alpino/Alpino-Medium.otf'),
  });
  const [isAuthBlockingSplash, setIsAuthBlockingSplash] = useState(true);
  const [hasSplashBlockTimedOut, setHasSplashBlockTimedOut] = useState(false);
  const hasHiddenSplashRef = useRef(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setHasSplashBlockTimedOut(true);
    }, SPLASH_MAX_BLOCK_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const areFontsReady = fontsLoaded || Boolean(fontLoadError);
    const shouldKeepSplashVisible =
      (isAuthBlockingSplash && !hasSplashBlockTimedOut) || !areFontsReady;

    if (shouldKeepSplashVisible || hasHiddenSplashRef.current) {
      return;
    }

    hasHiddenSplashRef.current = true;
    void SplashScreen.hideAsync().catch(() => {
      // Ignore if splash was already hidden.
    });
  }, [fontLoadError, fontsLoaded, isAuthBlockingSplash, hasSplashBlockTimedOut]);

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useDrizzleStudio(db as unknown as Parameters<typeof useDrizzleStudio>[0]);
  }
  return (
    <ClerkProvider
      __experimental_resourceCache={resourceCache}
      tokenCache={tokenCache}
      publishableKey={publishableKey}
    >
      <QueryClientProvider>
        <KeyboardProvider>
          <MigrationProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <InstantAuthHandler
                showBlockingOverlay={false}
                onBlockingAuthLoadChange={setIsAuthBlockingSplash}
              />
              <InitialLayout />
              <InstantAuthBlockingOverlay />
              <PortalHost />
            </GestureHandlerRootView>
          </MigrationProvider>
        </KeyboardProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
