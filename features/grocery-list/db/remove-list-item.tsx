import { and, eq } from 'drizzle-orm';
import { groceryListItemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';

type RemoveListItemArgs = {
  itemId: string;
  groceryListId: string;
};

export const removeListItem = ({
  itemId,
  groceryListId,
}: RemoveListItemArgs) => {
  return db
    .delete(groceryListItemTable)
    .where(
      and(
        eq(groceryListItemTable.id, itemId),
        eq(groceryListItemTable.groceryListId, groceryListId)
      )
    );
};
