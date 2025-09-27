import { MigrationProvider } from '@/providers/migration-provider';
import { QueryClientProvider } from '@/providers/query-client-provider';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PortalHost } from '@rn-primitives/portal';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { Stack } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-get-random-values';
import '../global.css';
const db = SQLite.openDatabaseSync('db.db');

export default function RootLayout() {
  if (process.env.NODE_ENV === 'development') {
    useDrizzleStudio(db);
  }
  return (
    <QueryClientProvider>
      <MigrationProvider>
        <GestureHandlerRootView>
          <BottomSheetModalProvider>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            />
            <PortalHost />
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </MigrationProvider>
    </QueryClientProvider>
  );
}
