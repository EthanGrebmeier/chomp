import { toast } from 'sonner-native';

import { db } from '../../../lib/instant';
import { buildLeaveListCleanupTransactions } from '../../meal-planner/instant/build-leave-list-cleanup-transactions';
import { queryLeaverMealPlanRecipeSyncRows } from '../../meal-planner/instant/query-meal-plan-entry-sync-rows';

/** Shown in every leave confirmation. */
export const LEAVE_LIST_MEAL_PLAN_WARNING =
  'Meals you planned with your recipes will be removed from this list.';

export const useLeaveGroceryList = () => {
  const leaveGroceryList = async (listId: string) => {
    try {
      const user = await db.getAuth();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Find the user's share for this list
      // Membership and contribution cleanup require fresh server data.
      const { data } = await db.queryOnce({
        grocery_list_shares: {},
      });

      const userShare = data?.grocery_list_shares?.find(
        share => share.user_id === user.id && share.grocery_list_id === listId
      );

      if (!userShare) {
        toast.success('You have left this list');
        return true;
      }

      // Remove the meals planned with the leaver's recipes (and their unchecked
      // linked items) first, while the share still grants permission to. If
      // this fails, the leave fails too rather than leaving the other members
      // with meals whose recipe they can no longer see.
      const recipeRows = await queryLeaverMealPlanRecipeSyncRows({
        userId: user.id,
        listId,
      });
      const cleanup = buildLeaveListCleanupTransactions({
        listId,
        userId: user.id,
        recipeRows,
      });
      if (cleanup.length > 0) {
        const result = await db.transact(cleanup);
        if (result.status !== 'synced')
          throw new Error('Cleanup not confirmed');
      }

      // Delete the share to leave the list
      const result = await db.transact([
        db.tx.grocery_list_shares[userShare.id].delete(),
      ]);
      if (result.status !== 'synced') {
        toast.error('Waiting for a connection to confirm leaving this list');
        return false;
      }
      toast.success('You have left this list');
      return true;
    } catch {
      toast.error('Could not leave list. Check your connection and try again.');
      return false;
    }
  };

  return leaveGroceryList;
};
