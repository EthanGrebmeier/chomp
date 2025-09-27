import { eq } from 'drizzle-orm';
import { groceryListItemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
type CheckListItemArgs = {
  itemId: string;
  isChecked: boolean;
};

export const checkListItem = ({ itemId, isChecked }: CheckListItemArgs) => {
  return db
    .update(groceryListItemTable)
    .set({ isChecked })
    .where(eq(groceryListItemTable.id, itemId));
};
