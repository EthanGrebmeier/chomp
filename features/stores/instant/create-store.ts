import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';

export type CreateStoreArgs = {
  name: string;
  isDefault?: boolean;
};

export const createStore = async ({ name, isDefault = false }: CreateStoreArgs) => {
  const user = await db.getAuth();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const storeId = id();
  const now = new Date().toISOString();
  const transactions: Parameters<typeof db.transact>[0] = [];

  if (isDefault) {
    const result = await db.queryOnce({
      stores: {
        user: {},
      },
    });

    const currentDefaultStoreUpdates =
      result.data.stores
        ?.filter(store => store.user?.id === user.id && store.isDefault)
        .map(store =>
          tx.stores[store.id].update({
            isDefault: false,
            updatedAt: now,
          })
        ) ?? [];

    transactions.push(...currentDefaultStoreUpdates);
  }

  transactions.push(
    tx.stores[storeId].update(
      trimStringFields({
        name,
        isDefault,
        createdAt: now,
        updatedAt: now,
      })
    ),
    tx.stores[storeId].link({
      user: user.id,
    })
  );

  await db.transact(transactions);

  return { id: storeId };
};
