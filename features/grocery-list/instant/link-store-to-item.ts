import { db } from '../../../lib/instant';

export type LinkStoreToItemArgs = {
  itemId: string;
  storeId?: string;
  currentStoreId?: string;
};

export const linkStoreToItem = async ({
  itemId,
  storeId,
  currentStoreId,
}: LinkStoreToItemArgs) => {
  const transactions = [];

  // If storeId is undefined and we have a current store, unlink it
  if (storeId === undefined && currentStoreId) {
    transactions.push(
      db.tx.grocery_items[itemId].unlink({
        store: currentStoreId,
      })
    );
  }
  // If storeId is different from current, handle the change
  else if (storeId !== currentStoreId) {
    // Unlink current store if it exists
    if (currentStoreId) {
      transactions.push(
        db.tx.grocery_items[itemId].unlink({
          store: currentStoreId,
        })
      );
    }
    // Link new store if provided
    if (storeId) {
      transactions.push(
        db.tx.grocery_items[itemId].link({
          store: storeId,
        })
      );
    }
  }

  if (transactions.length > 0) {
    await db.transact(transactions);
  }
};

