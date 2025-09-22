import { MigrationProvider } from '@/providers/migration-provider';
import { QueryClientProvider } from '@/providers/query-client-provider';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { PortalHost } from '@rn-primitives/portal';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { Tabs } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import { AppleIcon } from 'lucide-react-native';
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
            <Tabs screenOptions={{ headerShown: false }}>
              <Tabs.Screen
                name="index"
                options={{
                  title: 'Grocery List',
                  tabBarIcon: () => <AppleIcon size={24} color="black" />,
                  tabBarActiveTintColor: 'black',
                }}
              />
            </Tabs>
            <PortalHost />
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </MigrationProvider>
    </QueryClientProvider>
  );
}
