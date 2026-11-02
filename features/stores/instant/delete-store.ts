import { transactLocally } from '@/lib/instant/local-transaction';

import { db } from '../../../lib/instant';

export type DeleteStoreArgs = {
  storeId: string;
};

export const deleteStore = async ({ storeId }: DeleteStoreArgs) => {
  await transactLocally([db.tx.stores[storeId].delete()]);
};
