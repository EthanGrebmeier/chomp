import { ClerkLoaded, ClerkProvider } from '@clerk/clerk-expo';
import { resourceCache } from '@clerk/clerk-expo/resource-cache';
import { PortalHost } from '@rn-primitives/portal';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { Stack } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-get-random-values';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Toaster } from 'sonner-native';

import { tokenCache } from '@/lib/clerk-token-cache';
import { MigrationProvider } from '@/providers/migration-provider';
import { QueryClientProvider } from '@/providers/query-client-provider';

import '../global.css';
import { useTheme } from '../hooks/use-theme';

const db = SQLite.openDatabaseSync('db.db');

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
            sheetAllowedDetents: [1],
            sheetInitialDetentIndex: 0,
            contentStyle: {
              height: '100%',
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
      <ClerkLoaded>
        <QueryClientProvider>
          <KeyboardProvider>
            <MigrationProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
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
