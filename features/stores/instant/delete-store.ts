import { db } from '../../../lib/instant';

export type DeleteStoreArgs = {
  storeId: string;
};

export const deleteStore = async ({ storeId }: DeleteStoreArgs) => {
  await db.transact([db.tx.stores[storeId].delete()]);
};

