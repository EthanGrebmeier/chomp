import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';

export type AddMealsToGroceryListArgs = {
  listId: string;
};

export const addMealsToGroceryList = async ({
  listId,
}: AddMealsToGroceryListArgs) => {
  // Query all user's meal plan recipes and items without where clauses (for offline support)
  // Permissions will automatically filter to the current user's data
  const result = await db.queryOnce({
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
  });

  const now = new Date().toISOString();
  const transactions = [];
  const updateTransactions = [];

  // Filter for recipes that haven't been added to a list yet
  const unaddedRecipes =
    result.data.meal_plan_recipes?.filter(mpr => !mpr.addedToList) || [];

  // Add each recipe's ingredients to the grocery list
  for (const mealPlanRecipe of unaddedRecipes) {
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

      // Link store if ingredient has one
      if (ingredient.store?.id) {
        transactions.push(
          tx.grocery_items[itemId].link({
            store: ingredient.store.id,
          })
        );
      }
    }

    // Mark the meal plan recipe as added to list
    updateTransactions.push(
      tx.meal_plan_recipes[mealPlanRecipe.id].update({
        addedToList: true,
        addedToListAt: now,
        updatedAt: now,
      })
    );
  }

  // Filter for items that haven't been added to a list yet
  const unaddedItems =
    result.data.meal_plan_items?.filter(mpi => !mpi.addedToList) || [];

  // Add meal plan items to the grocery list
  for (const mealPlanItem of unaddedItems) {
    const itemId = id();

    transactions.push(
      tx.grocery_items[itemId].update({
        name: mealPlanItem.name,
        quantity: mealPlanItem.quantity,
        unit: mealPlanItem.unit,
        notes: mealPlanItem.notes,
        category: mealPlanItem.category,
        isChecked: false,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      }),
      tx.grocery_items[itemId].link({
        grocery_list: listId,
      })
    );

    // Link store if item has one
    if (mealPlanItem.store?.id) {
      transactions.push(
        tx.grocery_items[itemId].link({
          store: mealPlanItem.store.id,
        })
      );
    }

    // Mark the meal plan item as added to list
    updateTransactions.push(
      tx.meal_plan_items[mealPlanItem.id].update({
        addedToList: true,
        addedToListAt: now,
        updatedAt: now,
      })
    );
  }

  // Combine all transactions
  const allTransactions = [...transactions, ...updateTransactions];

  if (allTransactions.length > 0) {
    await db.transact(allTransactions);
  }

  return {
    addedRecipes: unaddedRecipes.length,
    addedItems: unaddedItems.length,
  };
};
