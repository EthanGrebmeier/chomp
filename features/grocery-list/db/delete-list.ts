import { eq } from 'drizzle-orm';
import { groceryListItemTable, groceryListTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';

type DeleteListArgs = {
  listId: string;
};

export const deleteList = async ({ listId }: DeleteListArgs) => {
  // First delete all items in the list
  await db
    .delete(groceryListItemTable)
    .where(eq(groceryListItemTable.groceryListId, listId));

  // Then delete the list itself
  await db.delete(groceryListTable).where(eq(groceryListTable.id, listId));
  return { success: true };
};
