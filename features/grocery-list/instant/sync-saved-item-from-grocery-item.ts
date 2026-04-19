import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { upsertLocalSavedItem } from '../../saved-items/local/upsert-local-saved-item';
import { GroceryListItem } from '../types';

export type SyncSavedItemFromGroceryItemArgs = {
  item: Partial<GroceryListItem> & { storeId?: string };
  nextSavedItemId?: string;
  currentSavedItemOwnerId?: string;
  selectedLocalSavedItemId?: string;
  savedItemStoreId?: string;
  currentItemName?: string;
};

/**
 * Syncs a grocery item's edits into its linked saved item surface:
 *   - saved_items row update (owner-gated)
 *   - saved_items↔stores reconcile against the provided baseline storeId
 *   - local-saved-item upsert when there is no cloud saved item linked
 *     (or the caller picked a local-only match)
 *
 * The owner gate lives here so callers don't have to duplicate it. If the
 * current user does not own the target saved item, the cloud writes are
 * skipped silently.
 */
export const syncSavedItemFromGroceryItem = async ({
  item,
  nextSavedItemId,
  currentSavedItemOwnerId,
  selectedLocalSavedItemId,
  savedItemStoreId,
  currentItemName,
}: SyncSavedItemFromGroceryItemArgs) => {
  const { storeId, name, category, notes } = item;

  const hasItemFields =
    name !== undefined || category !== undefined || notes !== undefined;
  const hasStoreInput = storeId !== undefined || savedItemStoreId !== undefined;
  const useLocalPath = !nextSavedItemId || !!selectedLocalSavedItemId;

  if (!hasItemFields && !hasStoreInput && !useLocalPath) {
    return;
  }

  if (useLocalPath) {
    const nextName = name ?? currentItemName;
    if (!nextName) {
      return;
    }

    await upsertLocalSavedItem({
      item: {
        name: nextName,
        category,
        notes,
        storeId,
      },
      selectedLocalSavedItemId,
      matchName: currentItemName,
    });
    return;
  }

  const user = await db.getAuth();
  if (!user || user.id !== currentSavedItemOwnerId) {
    return;
  }

  const now = new Date().toISOString();
  await db.transact([
    db.tx.saved_items[nextSavedItemId].update(
      trimStringFields({
        name,
        category: category ?? null,
        notes: notes ?? null,
        updatedAt: now,
      })
    ),
  ]);

  const savedItemStoreTransactions = [];
  if (storeId === undefined && savedItemStoreId) {
    savedItemStoreTransactions.push(
      db.tx.saved_items[nextSavedItemId].unlink({
        store: savedItemStoreId,
      })
    );
  } else if (storeId && storeId !== savedItemStoreId) {
    if (savedItemStoreId) {
      savedItemStoreTransactions.push(
        db.tx.saved_items[nextSavedItemId].unlink({
          store: savedItemStoreId,
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
