import { id } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
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
      db.tx.grocery_lists[listId]
        .create(
          trimStringFields({
            name,
            joinCode,
            ownerId: user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        )
        .link({
          owner: user.id,
        }),
      db.tx.grocery_list_shares[shareId]
        .create(
          trimStringFields({
            grocery_list_id: listId,
            user_id: user.id,
          })
        )
        .link({
          grocery_list: listId,
        }),
    ]);
    return { listId };
  };

  return createGroceryList;
};
