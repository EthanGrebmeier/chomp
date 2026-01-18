import { id } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { BaseSavedItem } from '../types';

export type AddSavedItemArgs = BaseSavedItem;

export const addSavedItem = async (item: AddSavedItemArgs) => {
  const user = await db.getAuth();
  if (!user) {
    throw new Error('User not authenticated');
  }

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

  return { id: itemId };
};

