import { and, eq, isNull } from 'drizzle-orm';

import { db } from '../../../db/local';
import { localSavedItemTable } from '../../../db/schema';
import { db as instantDb } from '../../../lib/instant';

import { normalizeLocalSavedItemOwnerId } from './local-saved-item-scope';

export type DeleteLocalItemArgs = {
  itemId: string;
  /**
   * Allow removing a shared catalog default row. Defaults are protected from
   * the general saved-items delete flow, but the add sheet lets users curate
   * their on-device suggestions, so it opts in explicitly.
   */
  allowDefault?: boolean;
};

/**
 * Delete a local saved item from SQLite.
 */
export const deleteLocalItem = async ({
  itemId,
  allowDefault = false,
}: DeleteLocalItemArgs) => {
  if (allowDefault) {
    // On-device curation: remove the row by id regardless of owner/default.
    // Local rows are per-device, so this only affects this install.
    await db
      .delete(localSavedItemTable)
      .where(eq(localSavedItemTable.id, itemId));
    return;
  }

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

