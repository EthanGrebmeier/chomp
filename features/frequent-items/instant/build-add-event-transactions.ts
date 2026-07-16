import { db } from '@/lib/instant';
import { trimStringFields } from '@/lib/utils/trim-string-fields';

import { BaseGroceryItem } from '../../grocery-list/types';
import { normalizeGroceryItemName } from '../utils/frequent-items';

export const buildAddEventTransactions = ({
  eventId,
  listId,
  item,
  addedAt,
}: {
  eventId: string;
  listId: string;
  item: BaseGroceryItem;
  addedAt: string;
}) => {
  const transactions = [
    db.tx.grocery_item_add_events[eventId].create(
      trimStringFields({
        normalizedName: normalizeGroceryItemName(item.name),
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        notes: item.notes,
        addedAt,
      })
    ),
    db.tx.grocery_item_add_events[eventId].link({
      grocery_list: listId,
    }),
  ];

  if (item.storeId) {
    transactions.push(
      db.tx.grocery_item_add_events[eventId].link({
        store: item.storeId,
      })
    );
  }

  return transactions;
};
