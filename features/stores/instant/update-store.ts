import { db } from '../../../lib/instant';

export type UpdateStoreArgs = {
  storeId: string;
  updates: {
    name?: string;
  };
};

export const updateStore = async ({
  storeId,
  updates,
}: UpdateStoreArgs) => {
  await db.transact([
    db.tx.stores[storeId].update({
      ...updates,
      updatedAt: new Date().toISOString(),
    }),
  ]);
};

