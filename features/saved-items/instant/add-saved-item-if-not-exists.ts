import { id } from '@instantdb/react-native';
import { and, eq, or } from 'drizzle-orm';

import { transactLocally } from '@/lib/instant/local-transaction';
import { readCachedQuery } from '@/lib/instant/read-cached-query';

import { db as sqliteDb } from '../../../db/local';
import { localSavedItemTable } from '../../../db/schema';
import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
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
    .where(
      and(
        eq(localSavedItemTable.name, item.name),
        or(
          eq(localSavedItemTable.isDefault, true),
          eq(localSavedItemTable.ownerId, user.id)
        )
      )
    );

  // Check if instantdb item already exists (case-insensitive name match)
  const { data } = await readCachedQuery({
    saved_items: { $: { where: { 'user.id': user.id } }, store: {} },
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

  await transactLocally([
    db.tx.saved_items[itemId].update(
      trimStringFields({
        name: item.name,
        category: item.category,
        notes: item.notes,
        createdAt: now,
        updatedAt: now,
      })
    ),
    db.tx.saved_items[itemId].link({
      user: user.id,
    }),
  ]);
};
