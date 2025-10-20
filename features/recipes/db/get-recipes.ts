import { eq } from 'drizzle-orm';
import {
  itemTable,
  recipeIngredientTable,
  recipeTable,
} from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { RecipeWithIngredients } from '../types';

export const getRecipes = async (): Promise<RecipeWithIngredients[]> => {
  const recipes = await db
    .select()
    .from(recipeTable)
    .orderBy(recipeTable.createdAt);

  const recipesWithIngredients: RecipeWithIngredients[] = [];

  for (const recipe of recipes) {
    const ingredients = await db
      .select({
        ingredient: recipeIngredientTable,
        item: itemTable,
      })
      .from(recipeIngredientTable)
      .leftJoin(itemTable, eq(recipeIngredientTable.itemId, itemTable.id))
      .where(eq(recipeIngredientTable.recipeId, recipe.id))
      .orderBy(recipeIngredientTable.order);

    const ingredientsWithItems = ingredients.map(({ ingredient, item }) => ({
      ...ingredient,
      item: item!,
    }));

    recipesWithIngredients.push({
      ...recipe,
      ingredients: ingredientsWithItems,
    });
  }

  return recipesWithIngredients;
};
