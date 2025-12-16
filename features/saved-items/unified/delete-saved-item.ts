import { removeSavedItem } from '../instant/remove-saved-item';
import { deleteLocalItem } from '../local/delete-local-item';
import { UnifiedSavedItem } from '../types';

export type DeleteSavedItemArgs = {
  item: UnifiedSavedItem;
};

/**
 * Delete a saved item, routing to the correct handler based on source.
 * - Local items are deleted from SQLite
 * - Cloud items are deleted from InstantDB
 */
export const deleteSavedItem = async ({ item }: DeleteSavedItemArgs) => {
  if (item.source === 'local') {
    await deleteLocalItem({ itemId: item.id });
  } else {
    await removeSavedItem({ itemId: item.id });
  }
};

