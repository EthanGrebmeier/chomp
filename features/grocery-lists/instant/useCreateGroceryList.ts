import { id } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { generateJoinCode } from '../utils/generate-join-code';

export const useCreateGroceryList = () => {
  const createGroceryList = async (name: string) => {
    const listId = id();
    const shareId = id();
    const joinCode = generateJoinCode();
    const user = await db.getAuth();
    if (!user) {
      throw new Error('User not authenticated');
    }

    await db.transact([
      db.tx.grocery_lists[listId].create({
        name,
        joinCode,
        ownerId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      db.tx.grocery_list_shares[shareId]
        .create({
          grocery_list_id: listId,
          user_id: user?.id,
        })
        .link({
          grocery_list: listId,
        }),
    ]);
    return { listId };
  };

  return createGroceryList;
};
