import { db } from '../../../lib/instant';
import { GroceryListItem } from '../types';

import { syncSavedItemFromGroceryItem } from './sync-saved-item-from-grocery-item';
import { updateGroceryItemOnly } from './update-grocery-item-only';

/**
 * Thin wrapper that composes the two extracted writers. Preserves the
 * legacy one-call ergonomics for the Add Item flow and other callers that
 * still expect a single entry point for "update grocery item + sync saved
 * item" in one go.
 */
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
  await updateGroceryItemOnly({
    itemId,
    item,
    currentStoreId,
    currentSavedItemId,
    selectedSavedItemId,
    selectedLocalSavedItemId,
  });

  const nextSavedItemId = selectedLocalSavedItemId
    ? undefined
    : selectedSavedItemId ?? currentSavedItemId;

  // Preserve the legacy "assume owner on pick" shortcut: when the caller
  // supplies a freshly selected cloud saved item, the old writer treated the
  // current user as its owner without a follow-up query. P5 will surface the
  // real ownerId alongside autocomplete matches; until then, fall back to the
  // current user's id when they picked the match themselves.
  let ownerIdForSync = currentSavedItemOwnerId;
  if (selectedSavedItemId && nextSavedItemId === selectedSavedItemId) {
    const user = await db.getAuth();
    if (user) {
      ownerIdForSync = user.id;
    }
  }

  const savedItemStoreId = selectedSavedItemId
    ? selectedSavedItemStoreId
    : currentSavedItemStoreId;

  await syncSavedItemFromGroceryItem({
    item,
    nextSavedItemId,
    currentSavedItemOwnerId: ownerIdForSync,
    selectedLocalSavedItemId,
    savedItemStoreId,
    currentItemName,
  });
};
