import { eq } from 'drizzle-orm';
import { groceryListItemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';

type RemoveListItemArgs = {
  itemId: string;
};

export const removeListItem = ({ itemId }: RemoveListItemArgs) => {
  return db
    .delete(groceryListItemTable)
    .where(eq(groceryListItemTable.id, itemId));
};
