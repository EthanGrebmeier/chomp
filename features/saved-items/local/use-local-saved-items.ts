import { and, eq, isNull, or } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import { localSavedItemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';

import {
  dedupeLocalSavedItemsForOwner,
  normalizeLocalSavedItemOwnerId,
} from './local-saved-item-scope';

export type LocalSavedItem = {
  id: string;
  ownerId: string | null;
  isDefault: boolean;
  name: string;
  category: string | null;
  notes: string | null;
  storeId: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Hook to query shared defaults plus local saved items owned by the active
 * Instant account. Anonymous rows are only visible while there is no auth id.
 */
export const useLocalSavedItems = (ownerId?: string | null) => {
  const normalizedOwnerId = normalizeLocalSavedItemOwnerId(ownerId);
  const ownerPredicate = normalizedOwnerId
    ? eq(localSavedItemTable.ownerId, normalizedOwnerId)
    : isNull(localSavedItemTable.ownerId);

  const { data, error } = useLiveQuery(
    db
      .select()
      .from(localSavedItemTable)
      .where(
        or(
          eq(localSavedItemTable.isDefault, true),
          and(eq(localSavedItemTable.isDefault, false), ownerPredicate)
        )
      )
      .orderBy(localSavedItemTable.name)
  );

  const scopedData = useMemo(
    () => dedupeLocalSavedItemsForOwner(data ?? [], normalizedOwnerId),
    [data, normalizedOwnerId]
  );

  return {
    data: scopedData,
    isLoading: !data && !error,
    error,
  };
};

