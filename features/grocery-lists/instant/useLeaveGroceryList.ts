import { db } from '../../../lib/instant';

export const useLeaveGroceryList = () => {
  const leaveGroceryList = async (listId: string) => {
    const user = await db.getAuth();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Find the user's share for this list
    const { data } = await db.queryOnce({
      grocery_list_shares: {},
    });

    const userShare = data?.grocery_list_shares?.find(
      share => share.user_id === user.id && share.grocery_list_id === listId
    );

    if (!userShare) {
      return;
    }
    // Delete the share to leave the list
    await db.transact([db.tx.grocery_list_shares[userShare.id].delete()]);
  };

  return leaveGroceryList;
};
