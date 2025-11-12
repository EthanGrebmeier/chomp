import { PortalHost } from '@rn-primitives/portal';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { Stack } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-get-random-values';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Toaster } from 'sonner-native';

import { MigrationProvider } from '@/providers/migration-provider';
import { QueryClientProvider } from '@/providers/query-client-provider';

import '../global.css';

const db = SQLite.openDatabaseSync('db.db');

export default function RootLayout() {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useDrizzleStudio(db);
  }
  return (
    <QueryClientProvider>
      <KeyboardProvider>
        <MigrationProvider>
          <GestureHandlerRootView>
            <View className="flex-1 bg-background">
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              />
              <Toaster
                position="top-center"
                toastOptions={{
                  style: {
                    borderRadius: 100,
                  },
                }}
              />
            </View>
            <PortalHost />
          </GestureHandlerRootView>
        </MigrationProvider>
      </KeyboardProvider>
    </QueryClientProvider>
  );
}
