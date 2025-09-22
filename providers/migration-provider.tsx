import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import * as SQLite from 'expo-sqlite';
import { Text, View } from 'react-native';
import migrations from '../drizzle/migrations';

const expo = SQLite.openDatabaseSync('db.db', { enableChangeListener: true });

export const db = drizzle(expo);

export const MigrationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { success, error } = useMigrations(db, migrations);

  if (!success) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold"> Loading migrations </Text>
      </View>
    );
  }
  if (error) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold"> {error.message} </Text>
      </View>
    );
  }
  return <>{children}</>;
};
