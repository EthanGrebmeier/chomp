import { and, eq, isNull } from 'drizzle-orm';

import { localSavedItemTable } from '../../../db/schema';
import { db as instantDb } from '../../../lib/instant';
import { db } from '../../../providers/migration-provider';

import { normalizeLocalSavedItemOwnerId } from './local-saved-item-scope';

export type DeleteLocalItemArgs = {
  itemId: string;
};

/**
 * Delete a local saved item from SQLite.
 */
export const deleteLocalItem = async ({ itemId }: DeleteLocalItemArgs) => {
  const auth = await instantDb.getAuth();
  const ownerId = normalizeLocalSavedItemOwnerId(auth?.id);
  const ownerPredicate = ownerId
    ? eq(localSavedItemTable.ownerId, ownerId)
    : isNull(localSavedItemTable.ownerId);

  await db
    .delete(localSavedItemTable)
    .where(
      and(
        eq(localSavedItemTable.id, itemId),
        eq(localSavedItemTable.isDefault, false),
        ownerPredicate
      )
    );
};

