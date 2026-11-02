import { transactLocally } from '@/lib/instant/local-transaction';

import { db } from '../../../lib/instant';

export type RemoveSavedItemArgs = {
  itemId: string;
};

export const removeSavedItem = async ({ itemId }: RemoveSavedItemArgs) => {
  await transactLocally([db.tx.saved_items[itemId].delete()]);
};
