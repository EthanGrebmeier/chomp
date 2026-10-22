import {
  CategoryOption,
  getCategoryNameKey,
} from '@/features/shared/category/categories';

import {
  IngredientCategory,
  ParseRecipeUrlResponse,
  RecipeImportCategory,
} from '../api/types';

/** Used when the server returns a category we didn't offer. */
export const FALLBACK_INGREDIENT_CATEGORY: IngredientCategory = 'other';

/** Builds the category list sent to the import API from the user's options. */
export const toRecipeImportCategories = (
  options: Pick<CategoryOption, 'value' | 'label'>[]
): RecipeImportCategory[] =>
  options.map(({ value, label }) => ({ value, label }));

/**
 * Maps a server-returned category onto one of the offered categories.
 * The server should echo a `value`, but we also accept a case-insensitive
 * value or label match so a sloppy model response still lands correctly.
 */
export const normalizeIngredientCategory = (
  category: string | null | undefined,
  categories: RecipeImportCategory[]
): IngredientCategory => {
  if (!category) return FALLBACK_INGREDIENT_CATEGORY;

  const exact = categories.find(option => option.value === category);
  if (exact) return exact.value;

  const key = getCategoryNameKey(category);
  const loose = categories.find(
    option =>
      option.value.toLowerCase() === key ||
      getCategoryNameKey(option.label) === key
  );
  return loose?.value ?? FALLBACK_INGREDIENT_CATEGORY;
};

export const normalizeParsedRecipeCategories = (
  response: ParseRecipeUrlResponse,
  categories: RecipeImportCategory[]
): ParseRecipeUrlResponse => ({
  ...response,
  ingredients: response.ingredients.map(ingredient => ({
    ...ingredient,
    category: normalizeIngredientCategory(ingredient.category, categories),
  })),
});
