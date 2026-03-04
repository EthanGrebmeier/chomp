import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { GroceryListItem } from '../types';
import { upsertLocalSavedItem } from '../../saved-items/local/upsert-local-saved-item';

import { linkStoreToItem } from './link-store-to-item';

export const updateGroceryListItem = async ({
  itemId,
  item,
  currentStoreId,
  currentSavedItemId,
  currentSavedItemOwnerId,
  currentSavedItemStoreId,
  selectedSavedItemId,
  selectedSavedItemStoreId,
  selectedLocalSavedItemId,
  currentItemName,
}: {
  itemId: string;
  item: Partial<GroceryListItem> & { storeId?: string };
  currentStoreId?: string;
  currentSavedItemId?: string;
  currentSavedItemOwnerId?: string;
  currentSavedItemStoreId?: string;
  selectedSavedItemId?: string;
  selectedSavedItemStoreId?: string;
  selectedLocalSavedItemId?: string;
  currentItemName?: string;
}) => {
  const { storeId, ...updateData } = item;
  const now = new Date().toISOString();
  const user = await db.getAuth();

  await db.transact([
    db.tx.grocery_items[itemId].update(
      trimStringFields({
        ...updateData,
        category: item.category ?? null,
      })
    ),
  ]);

  // Handle grocery item store linking/unlinking separately.
  if (storeId !== undefined || currentStoreId) {
    await linkStoreToItem({
      itemId,
      storeId,
      currentStoreId,
    });
  }

  // Preserve existing link unless user explicitly selected a new cloud suggestion.
  const shouldRelink =
    selectedSavedItemId !== undefined && selectedSavedItemId !== currentSavedItemId;
  const shouldUnlinkCloudForLocalSelection =
    !!selectedLocalSavedItemId && !!currentSavedItemId;

  if (shouldRelink) {
    const linkTransactions = [];
    if (currentSavedItemId) {
      linkTransactions.push(
        db.tx.grocery_items[itemId].unlink({
          saved_item: currentSavedItemId,
        })
      );
    }
    linkTransactions.push(
      db.tx.grocery_items[itemId].link({
        saved_item: selectedSavedItemId,
      })
    );
    await db.transact(linkTransactions);
  }

  if (shouldUnlinkCloudForLocalSelection && currentSavedItemId) {
    await db.transact([
      db.tx.grocery_items[itemId].unlink({
        saved_item: currentSavedItemId,
      }),
    ]);
  }

  const nextSavedItemId = selectedLocalSavedItemId
    ? undefined
    : selectedSavedItemId ?? currentSavedItemId;
  if (!nextSavedItemId) {
    const nextName = item.name ?? currentItemName;
    if (!nextName) {
      return;
    }

    await upsertLocalSavedItem({
      item: {
        name: nextName,
        category: item.category,
        notes: item.notes,
        storeId: item.storeId,
      },
      selectedLocalSavedItemId,
      matchName: currentItemName,
    });
    return;
  }

  if (!user) {
    return;
  }

  // Only sync saved item fields if the current editor owns the target saved item.
  const ownsNextSavedItem = selectedSavedItemId
    ? true
    : currentSavedItemOwnerId === user.id;
  if (!ownsNextSavedItem) {
    return;
  }

  await db.transact([
    db.tx.saved_items[nextSavedItemId].update(
      trimStringFields({
        name: item.name,
        category: item.category ?? null,
        notes: item.notes ?? null,
        updatedAt: now,
      })
    ),
  ]);

  const baselineSavedItemStoreId = selectedSavedItemId
    ? selectedSavedItemStoreId
    : currentSavedItemStoreId;

  const savedItemStoreTransactions = [];
  if (storeId === undefined && baselineSavedItemStoreId) {
    savedItemStoreTransactions.push(
      db.tx.saved_items[nextSavedItemId].unlink({
        store: baselineSavedItemStoreId,
      })
    );
  } else if (storeId && storeId !== baselineSavedItemStoreId) {
    if (baselineSavedItemStoreId) {
      savedItemStoreTransactions.push(
        db.tx.saved_items[nextSavedItemId].unlink({
          store: baselineSavedItemStoreId,
        })
      );
    }
    savedItemStoreTransactions.push(
      db.tx.saved_items[nextSavedItemId].link({
        store: storeId,
      })
    );
  }

  if (savedItemStoreTransactions.length > 0) {
    await db.transact(savedItemStoreTransactions);
  }
};
