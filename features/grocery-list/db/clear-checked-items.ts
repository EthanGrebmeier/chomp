import { eq } from 'drizzle-orm';

import { groceryListItemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';

export const clearCheckedItems = () => {
  return db
    .delete(groceryListItemTable)
    .where(eq(groceryListItemTable.isChecked, true));
};
