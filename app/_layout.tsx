import { ClerkProvider } from '@clerk/expo';
import { resourceCache } from '@clerk/expo/resource-cache';
import { tokenCache } from '@clerk/expo/token-cache';
import { PortalHost } from '@rn-primitives/portal';
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRootNavigationState,
  useSegments,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-get-random-values';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import {
  ReanimatedLogLevel,
  configureReanimatedLogger,
  useReducedMotion,
} from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';

import { QuantityAppProvider } from '@/features/quantity/app/provider';
import {
  reconcileAppEntry,
  reportAppEntryReady,
  type EntryScreen,
  type AppEntryState,
} from '@/lib/app-entry';
import { db } from '@/lib/instant';
import { QuantitySessionGate } from '@/lib/instant/quantity-session-gate';
import {
  InstantAuthHandler,
  useInstantAuthState,
} from '@/lib/instant/use-clerk-auth';
import { scheduleAfterPaint } from '@/lib/schedule-after-paint';
import { scheduleSplashHide } from '@/lib/schedule-splash-hide';
import { hasReachedStartupRoute } from '@/lib/startup-route';
import {
  AppEntryVisibleContext,
  markSplashDismissed,
  StartupScreenReadyContext,
} from '@/lib/startup-screen-ready';
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
  const reducedMotion = useReducedMotion();

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
          name="purchased-items"
          options={{
            presentation: 'card',
            gestureEnabled: true,
            animation: reducedMotion ? 'fade' : 'default',
            contentStyle: { backgroundColor: theme.background },
          }}
        />
        <Stack.Screen
          name="shopping"
          options={{
            presentation: 'card',
            gestureEnabled: true,
            animation: reducedMotion ? 'fade' : 'default',
            contentStyle: { backgroundColor: theme.background },
          }}
        />
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
  const colorscheme = useColorScheme();
  const [hasVisitedAuth, setHasVisitedAuth] = useState(false);
  if (!hasVisitedAuth && segments[0] === '(auth)') setHasVisitedAuth(true);
  const hasHiddenSplashRef = useRef(false);
  const { user } = db.useAuth();
  const theme = useTheme();
  const [entry, setEntry] = useState<AppEntryState>({
    userId: user?.id,
    ready: false,
    revealed: false,
    painted: false,
  });
  const entryScreen: EntryScreen | undefined =
    segments[0] === 'shopping'
      ? 'shopping'
      : segments[0] === '(tabs)' && segments.length === 1
        ? 'grocery'
        : undefined;
  const nextEntry = reconcileAppEntry(
    entry,
    user?.id,
    Boolean(entryScreen) && hasAppAccess && !shouldBlockAuthUi,
    entryScreen
  );
  if (nextEntry !== entry) setEntry(nextEntry);
  const isScreenReady =
    nextEntry.ready && nextEntry.readyScreen === entryScreen;
  const setIsScreenReady = useCallback(
    (ready: boolean, screen: EntryScreen) => {
      setEntry(current =>
        reportAppEntryReady(current, user?.id, ready, screen)
      );
    },
    [user?.id]
  );
  // The native launch splash retains its bounded offline fallback. This
  // additional cover belongs to a later sign-in, after that splash is gone.
  const coverEntry =
    hasVisitedAuth && Boolean(entryScreen) && !nextEntry.revealed;
  useEffect(() => {
    if (entry.revealed)
      return scheduleAfterPaint(() => {
        setEntry(current =>
          current.revealed ? { ...current, painted: true } : current
        );
      });
  }, [entry.revealed]);
  const splashPaintCleanup = useRef<(() => void) | undefined>(undefined);
  useEffect(() => () => splashPaintCleanup.current?.(), []);
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
    const shouldUseAppRoutes = hasAppAccess || isSignedInWithClerk;
    const hasReachedInitialLandingPoint = hasReachedStartupRoute(
      topLevelSegment,
      shouldUseAppRoutes
    );
    const isAppReady =
      isNavigationReady &&
      !shouldBlockAuthUi &&
      isReconciled &&
      hasReachedInitialLandingPoint;
    const canHideSplash =
      isStartupUpdateReady &&
      areFontsReady &&
      (isMigrationErrorVisible || isAppReady);

    if (!canHideSplash) {
      return;
    }

    // Other routes own their loading UI. For grocery and restored shopping, wait
    // for the persisted outbox and fresh access verification as well as items.
    const requiresScreenReadiness =
      topLevelSegment === 'shopping' ||
      (topLevelSegment === '(tabs)' && segments.length === 1);
    return scheduleSplashHide(
      hasHiddenSplashRef,
      () => {
        void hideSplashScreen().then(() => {
          // hideAsync dispatches a native hide; it is not an animation-complete
          // callback. Wait for paint before permitting planner preloading.
          splashPaintCleanup.current = scheduleAfterPaint(() =>
            markSplashDismissed()
          );
        });
      },
      requiresScreenReadiness && !isScreenReady && !isMigrationErrorVisible
        ? 5000
        : 0
    );
  }, [
    fontLoadError,
    fontsLoaded,
    hasAppAccess,
    isReconciled,
    isSignedInWithClerk,
    isStartupUpdateReady,
    isScreenReady,
    migrationStatus,
    rootNavigationState?.key,
    segments,
    shouldBlockAuthUi,
  ]);

  return (
    <StartupScreenReadyContext.Provider value={setIsScreenReady}>
      <ThemeProvider value={colorscheme === 'dark' ? DarkTheme : DefaultTheme}>
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
                    <AppEntryVisibleContext.Provider
                      value={!entryScreen || entry.painted}
                    >
                      <QuantityAppProvider>
                        <View
                          style={{ flex: 1 }}
                          pointerEvents={coverEntry ? 'none' : 'auto'}
                          accessibilityElementsHidden={coverEntry}
                          importantForAccessibility={
                            coverEntry ? 'no-hide-descendants' : 'auto'
                          }
                        >
                          <InitialLayout />
                        </View>
                        {coverEntry ? (
                          <View
                            accessibilityLabel="Loading your groceries"
                            accessibilityRole="progressbar"
                            style={[
                              StyleSheet.absoluteFill,
                              {
                                backgroundColor: theme.background,
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 999,
                              },
                            ]}
                          >
                            <ActivityIndicator color={theme.primary} />
                          </View>
                        ) : null}
                      </QuantityAppProvider>
                    </AppEntryVisibleContext.Provider>
                    <InstantAuthHandler />
                    <PortalHost />
                  </GestureHandlerRootView>
                </SafeAreaProvider>
              </MigrationProvider>
            </KeyboardProvider>
          </QueryClientProvider>
        </ClerkProvider>
      </ThemeProvider>
    </StartupScreenReadyContext.Provider>
  );
}

export default function RootLayout() {
  const { isReady: isStartupUpdateReady } = useStartupEasUpdate();

  return (
    <QuantitySessionGate>
      <RootLayoutContent isStartupUpdateReady={isStartupUpdateReady} />
    </QuantitySessionGate>
  );
}
