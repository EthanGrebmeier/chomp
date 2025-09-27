import { generateId } from '@/lib/utils';
import { groceryListTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { GroceryList } from '../types';

type CreateListArgs = {
  list: Omit<GroceryList, 'id'>;
};

export const createList = ({ list }: CreateListArgs) => {
  return db.insert(groceryListTable).values({
    id: generateId(),
    date: list.date,
  });
};
