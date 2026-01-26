import { addSavedItem } from '../instant/add-saved-item';
import { updateSavedItem as updateCloudSavedItem } from '../instant/update-saved-item';
import { deleteLocalItem } from '../local/delete-local-item';
import { BaseSavedItem, UnifiedSavedItem } from '../types';

export type UpdateSavedItemArgs = {
  item: UnifiedSavedItem;
  updates: Partial<BaseSavedItem>;
  currentStoreId?: string;
};

/**
 * Update a saved item, routing to the correct handler based on source.
 * - Local items are "promoted" to cloud: delete local + create cloud copy
 * - Cloud items are updated in place in InstantDB
 */
export const updateSavedItem = async ({
  item,
  updates,
  currentStoreId,
}: UpdateSavedItemArgs) => {
  if (item.source === 'local') {
    // Promote local item to cloud: delete local and create cloud copy
    const updatedItem: BaseSavedItem = {
      name: updates.name ?? item.name,
      category: updates.category ?? item.category,
      storeId: updates.storeId ?? item.storeId,
    };

    // Delete the local item first
    await deleteLocalItem({ itemId: item.id });

    // Create a new cloud item with the updated values
    const result = await addSavedItem(updatedItem);

    return { id: result.id, promoted: true };
  } else {
    // Update cloud item in place
    await updateCloudSavedItem({
      itemId: item.id,
      updates,
      currentStoreId,
    });

    return { id: item.id, promoted: false };
  }
};

