import { generateId } from '@/lib/utils';
import { groceryListTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { GroceryList } from '../types';

type CreateListArgs = {
  list: Omit<GroceryList, 'id' | 'createdAt' | 'updatedAt'>;
};

export const createList = async ({ list }: CreateListArgs) => {
  const id = generateId();
  const now = new Date().toISOString();
  await db.insert(groceryListTable).values({
    id,
    createdAt: now,
    updatedAt: now,
    date: list.date,
    name: list.name,
    groupBy: list.groupBy,
  });
  return { id };
};
