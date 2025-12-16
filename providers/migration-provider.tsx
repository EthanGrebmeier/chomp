import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import * as SQLite from 'expo-sqlite';
import { Text, View } from 'react-native';

import migrations from '../drizzle/migrations';
import { useSeedLocalItems } from '../features/saved-items/local/use-seed-local-items';

const expo = SQLite.openDatabaseSync('db.db', { enableChangeListener: true });

export const db = drizzle(expo);

export const MigrationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  console.log(migrations.journal);
  const { success, error } = useMigrations(db, migrations);

  // Seed local items in the background after migrations complete (non-blocking)
  useSeedLocalItems({ enabled: success });

  if (error) {
    console.error(error);
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold"> {error.message} </Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold">Loading migrations</Text>
      </View>
    );
  }

  return <>{children}</>;
};
