import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { MealPlanIngredientSnapshotCreateInput } from '../meal-plan-recipe-ingredient-editor';

export type AddRecipeToDateArgs = {
  listId: string;
  recipeId: string;
  date: string;
  mealTag?: string;
  servings?: number;
  ingredientSnapshots?: MealPlanIngredientSnapshotCreateInput[];
};

export const addRecipeToDate = async ({
  listId,
  recipeId,
  date,
  mealTag,
  servings = 1,
  ingredientSnapshots,
}: AddRecipeToDateArgs) => {
  const mealPlanRecipeId = id();
  const now = new Date().toISOString();
  const transactions = [
    tx.meal_plan_recipes[mealPlanRecipeId].update(
      trimStringFields({
        mealTag: mealTag,
        date: date,
        servings: servings,
        addedToList: false,
        createdAt: now,
        updatedAt: now,
      })
    ),
    tx.meal_plan_recipes[mealPlanRecipeId].link({
      grocery_list: listId,
      recipe: recipeId,
    }),
  ];

  for (const snapshot of ingredientSnapshots ?? []) {
    const snapshotId = id();
    transactions.push(
      tx.meal_plan_recipe_ingredient_snapshots[snapshotId].update(
        trimStringFields({
          sourceRecipeIngredientId: snapshot.sourceRecipeIngredientId,
          name: snapshot.name,
          quantity: snapshot.quantity,
          unit: snapshot.unit,
          notes: snapshot.notes ?? null,
          category: snapshot.category ?? null,
          isSelected: snapshot.isSelected,
          isQuantityOverridden: snapshot.isQuantityOverridden,
        })
      ),
      tx.meal_plan_recipe_ingredient_snapshots[snapshotId].link({
        meal_plan_recipe: mealPlanRecipeId,
      })
    );

    if (snapshot.storeId) {
      transactions.push(
        tx.meal_plan_recipe_ingredient_snapshots[snapshotId].link({
          store: snapshot.storeId,
        })
      );
    }
  }

  await db.transact(transactions);

  return { id: mealPlanRecipeId };
};
