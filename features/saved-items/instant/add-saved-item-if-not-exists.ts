import { id } from '@instantdb/react-native';
import { eq } from 'drizzle-orm';

import { localSavedItemTable } from '../../../db/schema';
import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { db as sqliteDb } from '../../../providers/migration-provider';
import { BaseSavedItem } from '../types';

/**
 * Add an item to saved items if it doesn't already exist.
 * This is used for auto-saving custom items when users add them to grocery lists or recipes.
 */
export const addSavedItemIfNotExists = async (item: BaseSavedItem) => {
  const user = await db.getAuth();
  if (!user) {
    return;
  }

  const sqliteItem = await sqliteDb
    .select()
    .from(localSavedItemTable)
    .where(eq(localSavedItemTable.name, item.name));

  // Check if instantdb item already exists (case-insensitive name match)
  const { data } = await db.queryOnce({
    saved_items: {},
  });

  const existingItem = data?.saved_items?.find(
    savedItem => savedItem.name.toLowerCase() === item.name.toLowerCase()
  );

  if (existingItem || sqliteItem.length > 0) {
    return;
  }

  // Add the new item
  const itemId = id();
  const now = new Date().toISOString();

  await db.transact([
    db.tx.saved_items[itemId].update(
      trimStringFields({
        name: item.name,
        category: item.category,
        createdAt: now,
        updatedAt: now,
      })
    ),
    db.tx.saved_items[itemId].link({
      user: user.id,
    }),
  ]);
};
