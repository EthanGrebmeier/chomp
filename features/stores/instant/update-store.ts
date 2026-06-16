import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';

export type UpdateStoreArgs = {
  storeId: string;
  updates: {
    name?: string;
    isDefault?: boolean;
  };
};

export const updateStore = async ({
  storeId,
  updates,
}: UpdateStoreArgs) => {
  const user = await db.getAuth();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const now = new Date().toISOString();
  const transactions: Parameters<typeof db.transact>[0] = [];

  if (updates.isDefault) {
    const result = await db.queryOnce({
      stores: {
        user: {},
      },
    });

    const currentDefaultStoreUpdates =
      result.data.stores
        ?.filter(
          store =>
            store.id !== storeId && store.user?.id === user.id && store.isDefault
        )
        .map(store =>
          db.tx.stores[store.id].update({
            isDefault: false,
            updatedAt: now,
          })
        ) ?? [];

    transactions.push(...currentDefaultStoreUpdates);
  }

  transactions.push(
    db.tx.stores[storeId].update(
      trimStringFields({
        ...updates,
        updatedAt: now,
      })
    ),
  );

  await db.transact(transactions);
};

