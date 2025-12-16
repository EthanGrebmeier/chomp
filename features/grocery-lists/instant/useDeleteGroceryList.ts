import { Alert } from 'react-native';

import { db } from '../../../lib/instant';

export const useDeleteGroceryList = () => {
  const deleteGroceryList = async (listId: string): Promise<boolean> => {
    const user = await db.getAuth();
    if (!user) {
      Alert.alert('Error', 'You must be signed in to delete a list.');
      return false;
    }

    // Check if user has more than one list before allowing deletion
    const { data } = await db.queryOnce({
      grocery_lists: {
        $: {
          where: {
            ownerId: user.id,
          },
        },
      },
    });

    const ownedListCount = data?.grocery_lists?.length ?? 0;
    if (ownedListCount <= 1) {
      Alert.alert(
        'Cannot Delete',
        'You must have at least one grocery list. Create a new list first if you want to delete this one.'
      );
      return false;
    }

    // Delete the grocery list - permissions will verify the user is the owner
    // Linked items and shares will be cascade deleted due to onDelete: 'cascade'
    await db.transact([db.tx.grocery_lists[listId].delete()]);
    return true;
  };

  return deleteGroceryList;
};
