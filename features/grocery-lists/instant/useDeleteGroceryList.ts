import { Alert } from 'react-native';
import { toast } from 'sonner-native';

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
      grocery_lists: {},
    });

    const ownedLists = data?.grocery_lists?.filter(
      list => list.ownerId === user.id
    );
    if (ownedLists?.length === 1) {
      toast.error('You cannot delete your only list.');
      return false;
    }

    // Delete the grocery list - permissions will verify the user is the owner
    // Linked items and shares will be cascade deleted due to onDelete: 'cascade'
    await db.transact([db.tx.grocery_lists[listId].delete()]);
    return true;
  };

  return deleteGroceryList;
};

export const useCanDeleteGroceryList = () => {
  const { user } = db.useAuth();

  const groceryLists = db.useQuery({
    grocery_lists: {},
  });

  if (!user || !groceryLists.data) {
    return false;
  }

  const myLists = groceryLists.data?.grocery_lists?.filter(
    list => list.ownerId === user.id
  );

  return myLists?.length > 1;
};
