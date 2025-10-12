import { eq } from 'drizzle-orm';
import { groceryListTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';

type DeleteListArgs = {
  listId: string;
};

export const deleteList = async ({ listId }: DeleteListArgs) => {
  await db.delete(groceryListTable).where(eq(groceryListTable.id, listId));
  return { success: true };
};
