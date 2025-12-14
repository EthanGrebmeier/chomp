import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';

export type AddMealPlanToGroceryListArgs = {
  mealPlanId: string;
  listId: string;
};

export const addMealPlanToGroceryList = async ({
  mealPlanId,
  listId,
}: AddMealPlanToGroceryListArgs) => {
  // Get all recipes in the meal plan with their ingredients
  const result = await db.queryOnce({
    meal_plans: {
      $: {
        where: {
          id: mealPlanId,
        },
      },
      meal_plan_recipes: {
        recipe: {
          recipe_ingredients: {},
        },
      },
    },
  });

  const mealPlan = result.data.meal_plans[0];

  if (!mealPlan) {
    throw new Error('Meal plan not found');
  }

  const now = new Date().toISOString();
  const transactions = [];

  // Add each recipe's ingredients to the grocery list
  for (const mealPlanRecipe of mealPlan.meal_plan_recipes || []) {
    const recipe = mealPlanRecipe.recipe;
    if (!recipe) continue;

    const ingredients = recipe.recipe_ingredients || [];
    const servings = mealPlanRecipe.servings || 1;

    for (const ingredient of ingredients) {
      const itemId = id();
      const adjustedQuantity = ingredient.quantity * servings;

      transactions.push(
        tx.grocery_items[itemId].update({
          name: ingredient.name,
          quantity: adjustedQuantity,
          unit: ingredient.unit,
          notes: ingredient.notes,
          category: ingredient.category,
          isChecked: false,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        }),
        tx.grocery_items[itemId].link({
          grocery_list: listId,
          recipe: recipe.id,
        })
      );
    }
  }

  if (transactions.length > 0) {
    await db.transact(transactions);
  }

  return {
    addedItems: transactions.length / 2, // Each item has 2 transactions (update + link)
  };
};
