import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';

import { db } from '../db/local';
import migrations from '../drizzle/migrations';
import { useSeedLocalItems } from '../features/saved-items/local/use-seed-local-items';

export type MigrationStatus = 'pending' | 'success' | 'error';

export const MigrationProvider = ({
  children,
  onStatusChange,
}: {
  children: React.ReactNode;
  onStatusChange?: (status: MigrationStatus) => void;
}) => {
  const { success, error } = useMigrations(db, migrations);
  const status = useMemo<MigrationStatus>(() => {
    if (error) {
      return 'error';
    }

    if (success) {
      return 'success';
    }

    return 'pending';
  }, [error, success]);

  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);

  useEffect(() => {
    if (status === 'pending') {
      // eslint-disable-next-line no-console
      console.log('[migration] pending');
      return;
    }

    if (status === 'success') {
      // eslint-disable-next-line no-console
      console.log('[migration] success');
      return;
    }

    // eslint-disable-next-line no-console
    console.error('[migration] error', error);
  }, [error, status]);

  // Seed local items in the background after migrations complete (non-blocking)
  useSeedLocalItems({ enabled: success });

  if (error) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background px-6">
        <Text className="text-center text-2xl font-bold text-foreground">
          We could not finish setting up Chomp.
        </Text>
        <Text className="text-center text-base text-muted-foreground">
          Please close and reopen the app. If this keeps happening, contact
          support with this error:
        </Text>
        <Text className="text-center text-sm text-destructive">
          {error.message}
        </Text>
      </View>
    );
  }

  if (!success) {
    return null;
  }

  return <>{children}</>;
};
