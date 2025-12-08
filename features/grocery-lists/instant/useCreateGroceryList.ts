import { id } from '@instantdb/react-native';

import { db } from '../../../lib/instant';

export const useCreateGroceryList = () => {
  const createGroceryList = async (name: string) => {
    const list = await db.transact(
      db.tx.grocery_lists[id()].create({
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );
    return list;
  };

  return createGroceryList;
};
