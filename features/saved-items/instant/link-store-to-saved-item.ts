import { db } from '../../../lib/instant';

export type LinkStoreToSavedItemArgs = {
  itemId: string;
  storeId?: string;
  currentStoreId?: string;
};

export const linkStoreToSavedItem = async ({
  itemId,
  storeId,
  currentStoreId,
}: LinkStoreToSavedItemArgs) => {
  const transactions = [];

  // If storeId is undefined and we have a current store, unlink it
  if (storeId === undefined && currentStoreId) {
    transactions.push(
      db.tx.saved_items[itemId].unlink({
        store: currentStoreId,
      })
    );
  }
  // If storeId is different from current, handle the change
  else if (storeId !== currentStoreId) {
    // Unlink current store if it exists
    if (currentStoreId) {
      transactions.push(
        db.tx.saved_items[itemId].unlink({
          store: currentStoreId,
        })
      );
    }
    // Link new store if provided
    if (storeId) {
      transactions.push(
        db.tx.saved_items[itemId].link({
          store: storeId,
        })
      );
    }
  }

  if (transactions.length > 0) {
    await db.transact(transactions);
  }
};
