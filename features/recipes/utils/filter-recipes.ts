import { RecipeWithIngredients } from '../types';

export type RecipeSortOption = 'name' | 'recent';

export type RecipeFilterParams = {
  search?: string;
  mealTag?: string;
  sortBy?: RecipeSortOption;
};

const normalizeText = (value?: string | null) =>
  value?.trim().toLowerCase() ?? '';

const getSearchableText = (recipe: RecipeWithIngredients) => {
  const ingredientNames =
    recipe.recipe_ingredients?.map(ingredient => ingredient?.name ?? '') ?? [];

  return [recipe.name ?? '', recipe.description ?? '', ...ingredientNames].map(
    value => normalizeText(value)
  );
};

const matchesSearch = (recipe: RecipeWithIngredients, query: string) => {
  if (!query) {
    return true;
  }

  return getSearchableText(recipe).some(value => value.includes(query));
};

const matchesMealTag = (recipe: RecipeWithIngredients, mealTag: string) => {
  if (!mealTag || mealTag === 'all') {
    return true;
  }

  return normalizeText(recipe.mealTag ?? '') === mealTag;
};

const parseTimestamp = (timestamp?: string | null) => {
  const parsed = Date.parse(timestamp ?? '');
  return Number.isNaN(parsed) ? undefined : parsed;
};

const getListActivityTimestamp = (recipe: RecipeWithIngredients) => {
  const timestamps = [
    parseTimestamp(recipe.lastAddedToListAt),
    ...(recipe.grocery_items ?? []).map(item => parseTimestamp(item.createdAt)),
  ].filter((timestamp): timestamp is number => timestamp !== undefined);

  return timestamps.length > 0 ? Math.max(...timestamps) : undefined;
};

const getCreatedTimestamp = (recipe: RecipeWithIngredients) => {
  return parseTimestamp(recipe.createdAt) ?? 0;
};

export const filterRecipes = (
  recipes: RecipeWithIngredients[],
  { search, mealTag, sortBy }: RecipeFilterParams = {}
) => {
  const query = normalizeText(search);
  const normalizedMealTag = normalizeText(mealTag);

  const filtered = recipes.filter(
    recipe =>
      matchesSearch(recipe, query) && matchesMealTag(recipe, normalizedMealTag)
  );

  if (!sortBy) {
    return filtered;
  }

  const sorted = [...filtered];

  if (sortBy === 'name') {
    sorted.sort((a, b) =>
      (a.name ?? '').localeCompare(b.name ?? '', undefined, {
        sensitivity: 'base',
      })
    );
    return sorted;
  }

  if (sortBy === 'recent') {
    sorted.sort((a, b) => {
      const aActivity = getListActivityTimestamp(a);
      const bActivity = getListActivityTimestamp(b);

      if (aActivity !== undefined || bActivity !== undefined) {
        if (aActivity === undefined) return 1;
        if (bActivity === undefined) return -1;
        if (aActivity !== bActivity) return bActivity - aActivity;
      }

      const createdDifference = getCreatedTimestamp(b) - getCreatedTimestamp(a);
      if (createdDifference !== 0) return createdDifference;

      return (a.name ?? '').localeCompare(b.name ?? '', undefined, {
        sensitivity: 'base',
      });
    });
  }

  return sorted;
};
