import { id } from '@instantdb/react-native';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';

type JoinResult =
  | { success: true; listId: string; listName: string }
  | { success: false; error: string };

const joinGroceryListByCode = async (joinCode: string): Promise<JoinResult> => {
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
        .create(
          trimStringFields({
            grocery_list_id: list.id,
            user_id: user.id,
          })
        )
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

export const useJoinGroceryListByCode = (
  options?: Omit<UseMutationOptions<JoinResult, Error, string>, 'mutationFn'>
) => {
  return useMutation({
    mutationFn: joinGroceryListByCode,
    ...options,
  });
};
