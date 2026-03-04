import { id } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { BaseGroceryItem } from '../types';
import { upsertLocalSavedItem } from '../../saved-items/local/upsert-local-saved-item';

export const addGroceryListItem = async ({
  listId,
  item,
  savedItemId,
  selectedCloudSavedItemStoreId,
  selectedLocalSavedItemId,
}: {
  listId: string;
  item: BaseGroceryItem;
  savedItemId?: string;
  selectedCloudSavedItemStoreId?: string;
  selectedLocalSavedItemId?: string;
}) => {
  const itemId = id();
  const now = new Date().toISOString();

  const transactions = [
    db.tx.grocery_items[itemId].create(
      trimStringFields({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        notes: item.notes,
        isChecked: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      })
    ),
    db.tx.grocery_lists[listId].link({
      grocery_items: itemId,
    }),
  ];

  // Link store if provided
  if (item.storeId) {
    transactions.push(
      db.tx.grocery_items[itemId].link({
        store: item.storeId,
      })
    );
  }

  if (savedItemId) {
    transactions.push(
      db.tx.grocery_items[itemId].link({
        saved_item: savedItemId,
      })
    );
  }

  await db.transact(transactions);

  if (savedItemId) {
    await db.transact([
      db.tx.saved_items[savedItemId].update(
        trimStringFields({
          name: item.name,
          category: item.category ?? null,
          notes: item.notes ?? null,
          updatedAt: now,
        })
      ),
    ]);

    const savedItemStoreTransactions = [];
    if (selectedCloudSavedItemStoreId && !item.storeId) {
      savedItemStoreTransactions.push(
        db.tx.saved_items[savedItemId].unlink({
          store: selectedCloudSavedItemStoreId,
        })
      );
    } else if (item.storeId && item.storeId !== selectedCloudSavedItemStoreId) {
      if (selectedCloudSavedItemStoreId) {
        savedItemStoreTransactions.push(
          db.tx.saved_items[savedItemId].unlink({
            store: selectedCloudSavedItemStoreId,
          })
        );
      }
      savedItemStoreTransactions.push(
        db.tx.saved_items[savedItemId].link({
          store: item.storeId,
        })
      );
    }

    if (savedItemStoreTransactions.length > 0) {
      await db.transact(savedItemStoreTransactions);
    }
    return;
  }

  await upsertLocalSavedItem({
    item,
    selectedLocalSavedItemId,
  });
};
