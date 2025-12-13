import { db } from '../../../lib/instant';

export const useDeleteGroceryList = () => {
  const deleteGroceryList = async (listId: string) => {
    const user = await db.getAuth();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Delete the grocery list - permissions will verify the user is the owner
    // Linked items and shares will be cascade deleted due to onDelete: 'cascade'
    await db.transact([db.tx.grocery_lists[listId].delete()]);
  };

  return deleteGroceryList;
};

