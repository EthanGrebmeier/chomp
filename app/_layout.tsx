import { ClerkProvider } from '@clerk/expo';
import { resourceCache } from '@clerk/expo/resource-cache';
import { AveriaSerifLibre_400Regular } from '@expo-google-fonts/averia-serif-libre';
import { Jaro_400Regular } from '@expo-google-fonts/jaro';
import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from 'expo-font';
import { Stack, useRootNavigationState, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-get-random-values';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import {
  ReanimatedLogLevel,
  configureReanimatedLogger,
} from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';

import { tokenCache } from '@/lib/clerk-token-cache';
import {
  InstantAuthHandler,
  useInstantAuthState,
} from '@/lib/instant/use-clerk-auth';
import { useStartupEasUpdate } from '@/lib/use-startup-eas-update';
import {
  MigrationProvider,
  type MigrationStatus,
} from '@/providers/migration-provider';
import { QueryClientProvider } from '@/providers/query-client-provider';

import '../global.css';
import { useTheme } from '../hooks/use-theme';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});
SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env'
  );
}

const hideSplashScreen = async () => {
  try {
    await SplashScreen.hideAsync();
  } catch {
    // Ignore native splash hide errors during reloads.
  }
};

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
          name="frequent-items/[listId]"
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
            presentation: 'card',
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

function RootLayoutContent({
  isStartupUpdateReady,
}: {
  isStartupUpdateReady: boolean;
}) {
  const [fontsLoaded, fontLoadError] = useFonts({
    'averia-serif-libre': AveriaSerifLibre_400Regular,
    'jaro-regular': Jaro_400Regular,
    'alpino-regular': require('../assets/fonts/alpino/Alpino-Regular.otf'),
    'alpino-medium': require('../assets/fonts/alpino/Alpino-Medium.otf'),
  });
  const { hasAppAccess, isReconciled, shouldBlockAuthUi } =
    useInstantAuthState();
  const rootNavigationState = useRootNavigationState();
  const segments = useSegments();
  const hasHiddenSplashRef = useRef(false);
  const [migrationStatus, setMigrationStatus] =
    useState<MigrationStatus | null>(null);
  const handleMigrationStatusChange = useCallback((status: MigrationStatus) => {
    setMigrationStatus(currentStatus =>
      currentStatus === status ? currentStatus : status
    );
  }, []);

  useEffect(() => {
    const areFontsReady = fontsLoaded || Boolean(fontLoadError);
    const isMigrationErrorVisible = migrationStatus === 'error';
    const isNavigationReady = Boolean(rootNavigationState?.key);
    const topLevelSegment = segments[0];
    const isOnTabsGroup = topLevelSegment === '(tabs)';
    const isOnAuthGroup = topLevelSegment === '(auth)';
    const hasReachedInitialLandingPoint = hasAppAccess
      ? isOnTabsGroup
      : isOnAuthGroup;
    const isAppReady =
      isNavigationReady &&
      !shouldBlockAuthUi &&
      isReconciled &&
      hasReachedInitialLandingPoint;
    const canHideSplash =
      isStartupUpdateReady &&
      areFontsReady &&
      (isMigrationErrorVisible || isAppReady);

    if (!canHideSplash || hasHiddenSplashRef.current) {
      return;
    }

    hasHiddenSplashRef.current = true;
    const timeoutId = setTimeout(hideSplashScreen, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    fontLoadError,
    fontsLoaded,
    hasAppAccess,
    isReconciled,
    isStartupUpdateReady,
    migrationStatus,
    rootNavigationState?.key,
    segments,
    shouldBlockAuthUi,
  ]);

  return (
    <ClerkProvider
      __experimental_resourceCache={resourceCache}
      tokenCache={tokenCache}
      publishableKey={publishableKey}
    >
      <QueryClientProvider>
        <KeyboardProvider>
          <MigrationProvider onStatusChange={handleMigrationStatusChange}>
            <SafeAreaProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <InstantAuthHandler />
                <InitialLayout />
                <PortalHost />
              </GestureHandlerRootView>
            </SafeAreaProvider>
          </MigrationProvider>
        </KeyboardProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function RootLayout() {
  const { isReady: isStartupUpdateReady } = useStartupEasUpdate();

  if (!isStartupUpdateReady) {
    return null;
  }

  return <RootLayoutContent isStartupUpdateReady={isStartupUpdateReady} />;
}
