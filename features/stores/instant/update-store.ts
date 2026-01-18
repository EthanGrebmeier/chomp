import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';

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
    db.tx.stores[storeId].update(
      trimStringFields({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
    ),
  ]);
};

