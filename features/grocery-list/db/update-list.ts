import { eq } from 'drizzle-orm';
import { groceryListTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { UpdateGroceryListArgs } from '../types';

export const updateList = async ({
  listId,
  updates,
}: UpdateGroceryListArgs) => {
  await db
    .update(groceryListTable)
    .set(updates)
    .where(eq(groceryListTable.id, listId));
};
