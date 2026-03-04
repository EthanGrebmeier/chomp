import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { localSavedItemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';

export type LocalSavedItem = {
  id: string;
  name: string;
  category: string | null;
  notes: string | null;
  storeId: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Hook to query all local saved items from SQLite.
 */
export const useLocalSavedItems = () => {
  const { data, error } = useLiveQuery(
    db.select().from(localSavedItemTable).orderBy(localSavedItemTable.name)
  );

  return {
    data: data ?? [],
    isLoading: !data && !error,
    error,
  };
};

