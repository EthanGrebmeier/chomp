import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';

export type CreateStoreArgs = {
  name: string;
};

export const createStore = async ({ name }: CreateStoreArgs) => {
  const user = await db.getAuth();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const storeId = id();
  const now = new Date().toISOString();

  await db.transact([
    tx.stores[storeId].update(
      trimStringFields({
        name,
        createdAt: now,
        updatedAt: now,
      })
    ),
    tx.stores[storeId].link({
      user: user.id,
    }),
  ]);

  return { id: storeId };
};
