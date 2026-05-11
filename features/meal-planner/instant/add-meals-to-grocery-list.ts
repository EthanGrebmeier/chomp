import { tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import {
  addIngredientsWithStacking,
  StackableIngredientInput,
} from '../../recipes/instant/stack-recipe-ingredients';
import { MealPlanIngredientSnapshotStore } from './meal-plan-ingredient-snapshot-store';
import { projectMealPlanRecipeToListInputs } from './meal-plan-to-list-projection';

export type AddMealsToGroceryListArgs = {
  listId: string;
  /** Recipe IDs to actually add ingredients for. If omitted, all unadded recipes are added. */
  selectedRecipeIds?: string[];
  /** Recipe IDs to mark as added without creating grocery items. */
  skippedRecipeIds?: string[];
  /** Item IDs to actually add. If omitted, all unadded items are added. */
  selectedItemIds?: string[];
  /** Item IDs to mark as added without creating grocery items. */
  skippedItemIds?: string[];
};

export const addMealsToGroceryList = async ({
  listId,
  selectedRecipeIds,
  skippedRecipeIds,
  selectedItemIds,
  skippedItemIds,
}: AddMealsToGroceryListArgs) => {
  const result = await db.queryOnce({
    grocery_lists: {
      $: {
        where: {
          id: listId,
        },
      },
      meal_plan_recipes: {
        recipe: {
          recipe_ingredients: {
            store: {},
          },
        },
      },
      meal_plan_items: {
        store: {},
      },
    },
  });
  const mealPlanData = result.data.grocery_lists?.[0];

  const now = new Date().toISOString();
  const updateTransactions: Parameters<typeof db.transact>[0] = [];
  const ingredientsToAdd: StackableIngredientInput[] = [];

  // Filter for recipes that haven't been added to a list yet
  const allUnaddedRecipes =
    mealPlanData?.meal_plan_recipes?.filter(mpr => !mpr.addedToList) || [];

  // Split into selected (add ingredients) and skipped (mark added only)
  const unaddedRecipes = selectedRecipeIds
    ? allUnaddedRecipes.filter(mpr => selectedRecipeIds.includes(mpr.id))
    : allUnaddedRecipes;

  const skippedRecipes = skippedRecipeIds
    ? allUnaddedRecipes.filter(mpr => skippedRecipeIds.includes(mpr.id))
    : [];

  // Mark skipped recipes as added without creating grocery items
  for (const mealPlanRecipe of skippedRecipes) {
    updateTransactions.push(
      tx.meal_plan_recipes[mealPlanRecipe.id].update(
        trimStringFields({
          addedToList: true,
          addedToListAt: now,
          updatedAt: now,
        })
      )
    );
  }

  // Collect each selected recipe's ingredients for metadata-aware stacking
  for (const mealPlanRecipe of unaddedRecipes) {
    const recipe = mealPlanRecipe.recipe;
    if (!recipe) continue;

    const sourceIngredients = recipe.recipe_ingredients || [];
    const snapshotRows = await MealPlanIngredientSnapshotStore.ensureBackfilledSnapshot(
      mealPlanRecipe.id
    );
    const reconciledRows = await MealPlanIngredientSnapshotStore.reconcileSnapshot(
      mealPlanRecipe.id
    );
    const projectionRows =
      reconciledRows.length > 0 || snapshotRows.length === 0
        ? reconciledRows
        : snapshotRows;

    ingredientsToAdd.push(
      ...projectMealPlanRecipeToListInputs({
        recipeId: recipe.id,
        servings: mealPlanRecipe.servings || 1,
        sourceIngredients,
        snapshotRows: projectionRows,
      })
    );

    // Mark the meal plan recipe as added to list
    updateTransactions.push(
      tx.meal_plan_recipes[mealPlanRecipe.id].update(
        trimStringFields({
          addedToList: true,
          addedToListAt: now,
          updatedAt: now,
        })
      )
    );
  }

  // Filter for items that haven't been added to a list yet
  const allUnaddedItems =
    mealPlanData?.meal_plan_items?.filter(mpi => !mpi.addedToList) || [];

  // Split into selected (add to list) and skipped (mark added only)
  const unaddedItems = selectedItemIds
    ? allUnaddedItems.filter(mpi => selectedItemIds.includes(mpi.id))
    : allUnaddedItems;

  const skippedItems = skippedItemIds
    ? allUnaddedItems.filter(mpi => skippedItemIds.includes(mpi.id))
    : [];

  // Mark skipped items as added without creating grocery items
  for (const mealPlanItem of skippedItems) {
    updateTransactions.push(
      tx.meal_plan_items[mealPlanItem.id].update(
        trimStringFields({
          addedToList: true,
          addedToListAt: now,
          updatedAt: now,
        })
      )
    );
  }

  // Collect selected meal plan items for metadata-aware stacking
  for (const mealPlanItem of unaddedItems) {
    ingredientsToAdd.push({
      name: mealPlanItem.name,
      quantity: mealPlanItem.quantity,
      unit: mealPlanItem.unit,
      notes: mealPlanItem.notes,
      category: mealPlanItem.category,
      storeName: mealPlanItem.store?.name,
      storeId: mealPlanItem.store?.id,
    });

    // Mark the meal plan item as added to list
    updateTransactions.push(
      tx.meal_plan_items[mealPlanItem.id].update(
        trimStringFields({
          addedToList: true,
          addedToListAt: now,
          updatedAt: now,
        })
      )
    );
  }

  if (ingredientsToAdd.length > 0) {
    await addIngredientsWithStacking({
      listId,
      ingredients: ingredientsToAdd,
      // Meal-plan bulk add is a single action; create separate items on metadata conflicts.
      conflictResolution: 'separate',
    });
  }

  if (updateTransactions.length > 0) {
    await db.transact(updateTransactions);
  }

  return {
    addedRecipes: unaddedRecipes.length,
    addedItems: unaddedItems.length,
  };
};
