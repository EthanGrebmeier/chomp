import { id } from '@instantdb/react-native';
import { toast } from 'sonner-native';

import { db } from '../../../lib/instant';
import { buildAddEventTransactions } from '../../frequent-items/instant/build-add-event-transactions';
import { upsertLocalSavedItem } from '../../saved-items/local/upsert-local-saved-item';
import { BaseGroceryItem } from '../types';

export const addGroceryListItem = ({
  listId,
  item,
  savedItemId,
  selectedLocalSavedItemId,
  persistLocalSavedItem = true,
}: {
  listId: string;
  item: BaseGroceryItem;
  savedItemId?: string;
  selectedCloudSavedItemStoreId?: string;
  selectedLocalSavedItemId?: string;
  /**
   * Whether to upsert a local saved-item history row for this add. Defaults
   * to `true` for quick-add flows. The add item sheet passes `false` because
   * its "Save item" toggle controls persistence explicitly (cloud-only when
   * on, nothing when off).
   */
  persistLocalSavedItem?: boolean;
}) => {
  const itemId = id();
  const now = new Date().toISOString();

  return import('@/features/quantity/app/grocery-actions').then(
    async ({ addManualQuantity }) => {
      await addManualQuantity(listId, item, savedItemId);
      try {
        await db.transact(
          buildAddEventTransactions({
            eventId: itemId,
            listId,
            item,
            addedAt: now,
          })
        );
        if (!savedItemId && persistLocalSavedItem)
          await upsertLocalSavedItem({ item, selectedLocalSavedItemId });
      } catch {
        toast.error(
          'Quantity saved, but recent-item history could not be updated'
        );
      }
    }
  );
};
