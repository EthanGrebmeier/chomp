import { db } from '../../../lib/instant';

export type RemoveSavedItemArgs = {
  itemId: string;
};

export const removeSavedItem = async ({ itemId }: RemoveSavedItemArgs) => {
  await db.transact([db.tx.saved_items[itemId].delete()]);
};

