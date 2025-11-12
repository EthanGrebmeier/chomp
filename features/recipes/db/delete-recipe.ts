import { eq } from 'drizzle-orm';

import { recipeTable } from '../../../db/schema';
import { db } from '../../../providers/migration-provider';

export const deleteRecipe = async (recipeId: string) => {
  await db.delete(recipeTable).where(eq(recipeTable.id, recipeId));
};
