import { eq } from 'drizzle-orm';

import { groceryListItemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';

type IncrementListItemArgs = {
  itemId: string;
  quantityToAdd: number;
};

export const incrementListItem = async ({
  itemId,
  quantityToAdd,
}: IncrementListItemArgs) => {
  // First get the current item
  const existingItem = await db
    .select()
    .from(groceryListItemTable)
    .where(eq(groceryListItemTable.id, itemId))
    .limit(1);

  if (existingItem.length === 0) {
    throw new Error('Item not found');
  }

  const currentQuantity = existingItem[0].quantity;
  const newQuantity = currentQuantity + quantityToAdd;

  // Update the item with the new quantity
  const result = await db
    .update(groceryListItemTable)
    .set({
      quantity: newQuantity,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(groceryListItemTable.id, itemId))
    .returning();

  return result[0];
};

