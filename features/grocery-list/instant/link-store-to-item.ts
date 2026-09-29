import { db, type TransactionChunk } from '../../../lib/instant';

export type LinkStoreToItemArgs = {
  itemId: string;
  storeId?: string;
  currentStoreId?: string;
};

/**
 * Builds the writes that move a grocery item's store link from
 * `currentStoreId` to `storeId` (unlinking when `storeId` is undefined).
 */
export const buildStoreLinkTransactions = ({
  itemId,
  storeId,
  currentStoreId,
}: LinkStoreToItemArgs): TransactionChunk[] => {
  const transactions: TransactionChunk[] = [];

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

  return transactions;
};
