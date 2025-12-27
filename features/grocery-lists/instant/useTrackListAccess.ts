import { db } from '../../../lib/instant';

export const useTrackListAccess = () => {
  const trackListAccess = async (listId: string) => {
    try {
      const user = await db.getAuth();
      if (!user) {
        return;
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

      // Update only the lastAccessedAt field to enforce field-level restrictions
      await db.transact([
        db.tx.grocery_list_shares[userShare.id].update({
          lastAccessedAt: new Date().toISOString(),
        }),
      ]);
    } catch (error) {
      console.error('Failed to track list access:', error);
    }
  };

  return trackListAccess;
};
