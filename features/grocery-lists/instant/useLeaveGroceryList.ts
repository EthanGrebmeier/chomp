import { db } from '../../../lib/instant';
import { buildLeaveListCleanupTransactions } from '../../meal-planner/instant/build-leave-list-cleanup-transactions';
import { queryLeaverMealPlanRecipeSyncRows } from '../../meal-planner/instant/query-meal-plan-entry-sync-rows';

/** Shown in every leave confirmation. */
export const LEAVE_LIST_MEAL_PLAN_WARNING =
  'Meals you planned with your recipes will be removed from this list.';

export const useLeaveGroceryList = () => {
  const leaveGroceryList = async (listId: string) => {
    const user = await db.getAuth();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Find the user's share for this list
    // We need this query once, but we can still use it offline since we supply no where clause
    const { data } = await db.queryOnce({
      grocery_list_shares: {},
    });

    const userShare = data?.grocery_list_shares?.find(
      share => share.user_id === user.id && share.grocery_list_id === listId
    );

    if (!userShare) {
      return;
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
      await db.transact(cleanup);
    }

    // Delete the share to leave the list
    await db.transact([db.tx.grocery_list_shares[userShare.id].delete()]);
  };

  return leaveGroceryList;
};
