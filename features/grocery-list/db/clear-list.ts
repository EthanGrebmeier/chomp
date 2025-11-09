import { groceryListItemTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';

export const clearGroceryList = () => {
  return db.delete(groceryListItemTable);
};
