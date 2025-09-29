import { eq } from 'drizzle-orm';
import { groceryListTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';

type UpdateListArgs = {
  listId: string;
  updates: {
    name?: string;
    date?: string;
  };
};

export const updateList = async ({ listId, updates }: UpdateListArgs) => {
  await db
    .update(groceryListTable)
    .set(updates)
    .where(eq(groceryListTable.id, listId));
};
