import { db } from '../../../lib/instant';

export const useLeaveGroceryList = () => {
  const leaveGroceryList = async (listId: string) => {
    const user = await db.getAuth();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Find the user's share for this list
    const { data } = await db.queryOnce({
      grocery_list_shares: {
        $: {
          where: {
            grocery_list_id: listId,
            user_id: user.id,
          },
        },
      },
    });

    const share = data?.grocery_list_shares?.[0];
    if (!share) {
      throw new Error('You are not a member of this list');
    }

    // Delete the share to leave the list
    await db.transact([db.tx.grocery_list_shares[share.id].delete()]);
  };

  return leaveGroceryList;
};

