import { id } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { generateJoinCode } from '../utils/generate-join-code';

export const useCreateGroceryList = () => {
  const connection = db.useConnectionStatus();
  const createGroceryList = async (name: string) => {
    // A new list needs its quantity workspace initialized on the server before
    // shopping can begin. Existing downloaded lists remain fully local.
    if (connection !== 'authenticated') {
      throw new Error('Connect to create a new list');
    }
    const listId = id();
    const shareId = id();
    const joinCode = generateJoinCode();
    const user = await db.getAuth();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const result = await db.transact([
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
    if (result.status !== 'synced') {
      throw new Error('Waiting for a connection to finish creating this list');
    }
    return { listId };
  };

  return createGroceryList;
};
