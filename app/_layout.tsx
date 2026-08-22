import { ClerkProvider } from '@clerk/expo';
import { resourceCache } from '@clerk/expo/resource-cache';
import { tokenCache } from '@clerk/expo/token-cache';
import { PortalHost } from '@rn-primitives/portal';
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

import { RecipesSettingsBarHost } from '@/features/shared/components/recipes-settings-bar';
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
import { useAppFonts } from '../hooks/use-app-fonts';
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
      <RecipesSettingsBarHost>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen
            name="meal-plan"
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
          <Stack.Screen
            name="saved-items"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [1],
              sheetInitialDetentIndex: 0,
              contentStyle: {
                backgroundColor: theme.background,
              },
            }}
          />
          <Stack.Screen
            name="stores"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [1],
              sheetInitialDetentIndex: 0,
              contentStyle: {
                backgroundColor: theme.background,
              },
            }}
          />
          <Stack.Screen
            name="categories"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [1],
              sheetInitialDetentIndex: 0,
              contentStyle: {
                backgroundColor: theme.background,
              },
            }}
          />
          <Stack.Screen
            name="account"
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
      </RecipesSettingsBarHost>
    </View>
  );
}

function RootLayoutContent({
  isStartupUpdateReady,
}: {
  isStartupUpdateReady: boolean;
}) {
  const [fontsLoaded, fontLoadError] = useAppFonts();
  const { hasAppAccess, isReconciled, isSignedInWithClerk, shouldBlockAuthUi } =
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
    const areFontsReady = fontsLoaded ? true : Boolean(fontLoadError);
    const isMigrationErrorVisible = migrationStatus === 'error';
    const isNavigationReady = Boolean(rootNavigationState?.key);
    const topLevelSegment = segments[0];
    const isOnTabsGroup = topLevelSegment === '(tabs)';
    const isOnAuthGroup = topLevelSegment === '(auth)';
    const shouldUseAppRoutes = hasAppAccess || isSignedInWithClerk;
    const hasReachedInitialLandingPoint = shouldUseAppRoutes
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
    isSignedInWithClerk,
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
                <InitialLayout />
                <InstantAuthHandler />
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
