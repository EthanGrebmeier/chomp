import { eq } from 'drizzle-orm';

import { localSavedItemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';

export type DeleteLocalItemArgs = {
  itemId: string;
};

/**
 * Delete a local saved item from SQLite.
 */
export const deleteLocalItem = async ({ itemId }: DeleteLocalItemArgs) => {
  await db
    .delete(localSavedItemTable)
    .where(eq(localSavedItemTable.id, itemId));
};

