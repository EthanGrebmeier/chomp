import { eq } from 'drizzle-orm';
import { recipeIngredientTable, recipeTable } from '../../../db/schema';
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
      .select()
      .from(recipeIngredientTable)
      .where(eq(recipeIngredientTable.recipeId, recipe.id))
      .orderBy(recipeIngredientTable.order);

    recipesWithIngredients.push({
      ...recipe,
      ingredients,
    });
  }

  return recipesWithIngredients;
};
