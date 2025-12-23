import { id } from '@instantdb/react-native';
import { toast } from 'sonner-native';

import { db } from '../../../lib/instant';

type JoinResult =
  | { success: true; listId: string; listName: string }
  | { success: false; error: string };

export const useJoinGroceryListByCode = () => {
  const joinGroceryListByCode = async (
    joinCode: string
  ): Promise<JoinResult> => {
    const user = await db.getAuth();
    if (!user) {
      return { success: false, error: 'You must be signed in to join a list' };
    }

    try {
      // Query for the list with this join code
      const { data } = await db.queryOnce(
        {
          grocery_lists: {
            $: {
              where: {
                joinCode,
              },
            },
            shares: {},
          },
        },
        {
          ruleParams: {
            knownJoinCode: joinCode,
          },
        }
      );

      if (!data?.grocery_lists || data.grocery_lists.length === 0) {
        return { success: false, error: 'No list found with that code' };
      }

      const list = data.grocery_lists[0];

      console.log('list to join', JSON.stringify(list, null, 2));

      // Check if user is already a member
      const isAlreadyMember = list.shares?.some(
        share => share.user_id === user.id
      );
      if (isAlreadyMember) {
        return {
          success: false,
          error: 'You are already a member of this list',
        };
      }

      // Create a share to add the user to the list
      // Chain ruleParams with the joinCode so permissions can verify access to the grocery_list
      const shareId = id();
      await db.transact([
        db.tx.grocery_list_shares[shareId]
          .create({
            grocery_list_id: list.id,
            user_id: user.id,
          })
          .link({
            grocery_list: list.id,
          }),
        // Add ruleParams to the grocery_list to prove we know the joinCode
        db.tx.grocery_lists[list.id].ruleParams({ knownJoinCode: joinCode }),
      ]);

      return { success: true, listId: list.id, listName: list.name };
    } catch {
      toast.error('Failed to join grocery list by code');
      return { success: false, error: 'Failed to join grocery list by code' };
    }
  };

  return joinGroceryListByCode;
};
