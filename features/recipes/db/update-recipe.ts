import { eq } from 'drizzle-orm';
import { recipeTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';
import { Recipe } from '../types';

type UpdateRecipeArgs = {
  recipe: Recipe;
};

export const updateRecipe = async ({ recipe }: UpdateRecipeArgs) => {
  await db.update(recipeTable).set(recipe).where(eq(recipeTable.id, recipe.id));
};
