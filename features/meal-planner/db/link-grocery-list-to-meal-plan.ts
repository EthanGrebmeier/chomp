import { eq } from 'drizzle-orm';
import { mealPlanTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';

type LinkGroceryListToMealPlanArgs = {
  mealPlanId: string;
  groceryListId: string;
};

export const linkGroceryListToMealPlan = async ({
  mealPlanId,
  groceryListId,
}: LinkGroceryListToMealPlanArgs) => {
  await db
    .update(mealPlanTable)
    .set({ groceryListId })
    .where(eq(mealPlanTable.id, mealPlanId));
};
