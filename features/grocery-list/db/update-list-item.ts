import { eq } from 'drizzle-orm';
import { groceryListItemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { updateItem } from '../../shared/db/update-item';
import { QuantityUnit } from '../../shared/types';

export const updateListItem = async ({
  itemId,
  updates,
}: {
  itemId: string;
  updates: {
    name?: string;
    quantity?: number;
    unit?: QuantityUnit;
    notes?: string;
  };
}) => {
  // Get the grocery list item to find the associated item
  const groceryListItem = await db
    .select({ itemId: groceryListItemTable.itemId })
    .from(groceryListItemTable)
    .where(eq(groceryListItemTable.id, itemId))
    .limit(1);

  if (groceryListItem.length === 0) {
    throw new Error('Grocery list item not found');
  }

  // Update the item
  const updatedItem = await updateItem({
    itemId: groceryListItem[0].itemId,
    updates,
  });

  return updatedItem;
};
