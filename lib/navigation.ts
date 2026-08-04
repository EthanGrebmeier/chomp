/**
 * Navigation utilities for the grocery app
 * Provides type-safe URL builders and navigation helpers
 *
 * Usage examples:
 *
 * // Using with router.push
 * import { router } from 'expo-router';
 * import { navigation } from '@/lib/navigation';
 *
 * router.push(navigation.goToList());
 * router.push(navigation.goToMealPlan('list-456'));
 * router.push(navigation.goToRecipe('recipe-789'));
 *
 * // Using the navActions (alternative API)
 * import { navActions } from '@/lib/navigation';
 *
 * router.push(navActions.goToList());
 *
 * // Using the hook in components
 * import { useNavigation } from '@/lib/navigation';
 *
 * const nav = useNavigation();
 * nav.goToList();
 */

import { Href } from 'expo-router';

const DEFAULT_PUBLIC_BASE_URL = 'https://chompgrocery.com';

const trimTrailingSlash = (url: string) => url.replace(/\/$/, '');

// Base route types
export type TabRoute = 'list' | 'recipes';

// Dynamic route parameters
export interface ListParams {
  listId?: string;
  view?: 'meal-plan';
}

export interface ListMealPlanParams {
  listId: string;
}

export interface FrequentItemsParams {
  listId: string;
}

export interface RecipeParams {
  recipeId: string;
  listId?: string;
}

export interface RecipesParams {
  listId?: string;
}

export interface CreateRecipeManualParams {
  listId?: string;
  name?: string;
}

export interface CreateRecipeImportParams {
  listId?: string;
}

export interface EditRecipeParams {
  recipeId: string;
  listId?: string;
}

const buildQueryString = (params: Record<string, string | undefined>) => {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Builds a URL for a specific tab
 */
export function buildRecipesUrl(params?: RecipesParams): Href {
  const query = buildQueryString({ listId: params?.listId });
  return `/recipes${query}` as Href;
}

/**
 * Builds a URL for the single grocery list page
 */
export function buildListUrl(params?: ListParams): Href {
  const query = buildQueryString({
    listId: params?.listId,
    view: params?.view,
  });
  return `/(tabs)${query}` as Href;
}

export function buildMealPlanUrl(params: ListMealPlanParams): Href {
  return buildListUrl({
    listId: params.listId,
    view: 'meal-plan',
  });
}

export function buildMealPlanAddToListUrl(params: ListMealPlanParams): Href {
  const { listId } = params;
  return {
    pathname: '/meal-plan/[listId]/add-to-list',
    params: { listId },
  } as unknown as Href;
}

export function buildFrequentItemsSheetUrl(params: FrequentItemsParams): Href {
  const { listId } = params;
  return {
    pathname: '/frequent-items/[listId]',
    params: { listId },
  } as unknown as Href;
}

/**
 * Builds a URL for a recipe detail page
 */
export function buildRecipeUrl(params: RecipeParams) {
  const { recipeId, listId } = params;
  return {
    pathname: '/recipes/[recipeId]',
    params: listId ? { recipeId, listId } : { recipeId },
  } as unknown as Href;
}

export function buildCreateRecipeManualUrl(
  params?: CreateRecipeManualParams
): Href {
  const query = buildQueryString({
    listId: params?.listId,
    name: params?.name,
  });
  return `/recipes/create/manual${query}` as Href;
}

export function buildCreateRecipeImportUrl(
  params?: CreateRecipeImportParams
): Href {
  const query = buildQueryString({ listId: params?.listId });
  return `/recipes/create/import${query}` as Href;
}

export function buildEditRecipeUrl(params: EditRecipeParams) {
  const { recipeId, listId } = params;
  return {
    pathname: '/recipes/edit/[recipeId]',
    params: listId ? { recipeId, listId } : { recipeId },
  } as unknown as Href;
}

/**
 * Builds a deep link URL for sharing a grocery list by join code
 */
export function buildListURL(joinCode: string): string {
  const baseUrl = trimTrailingSlash(
    process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_PUBLIC_BASE_URL
  );
  return `${baseUrl}/join-list/${encodeURIComponent(joinCode)}`;
}

/**
 * Builds a share URL for a recipe via the API redirect
 */
export function buildRecipeShareURL(recipeId: string): string | null {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) return null;
  return `${apiUrl}/recipes/share/${recipeId}`;
}

/**
 * Navigation helper functions that can be used with expo-router
 */
export const navigation = {
  // Tab navigation
  goToList: (listId?: string) => buildListUrl(listId ? { listId } : undefined),
  goToRecipes: (listId?: string) =>
    buildRecipesUrl(listId ? { listId } : undefined),

  // Meal plan view navigation
  goToMealPlan: (listId: string) => buildMealPlanUrl({ listId }),
  goToMealPlanAddToList: (listId: string) =>
    buildMealPlanAddToListUrl({ listId }),
  goToFrequentItems: (listId: string) => buildFrequentItemsSheetUrl({ listId }),

  // Recipe navigation
  goToRecipe: (recipeId: string, listId?: string) =>
    buildRecipeUrl({ recipeId, listId }),
  goToCreateRecipeManual: (listId?: string, name?: string) =>
    buildCreateRecipeManualUrl({ listId, name }),
  goToCreateRecipeImport: (listId?: string) =>
    buildCreateRecipeImportUrl({ listId }),
  goToEditRecipe: (recipeId: string, listId?: string) =>
    buildEditRecipeUrl({ recipeId, listId }),
} as const;

/**
 * Type-safe navigation hook that can be used in components
 * This provides a more convenient API for navigation
 */
export function useNavigation() {
  return {
    // Tab navigation
    goToList: (listId?: string) => navigation.goToList(listId),
    goToRecipes: (listId?: string) => navigation.goToRecipes(listId),

    // Meal plan view navigation
    goToMealPlan: (listId: string) => navigation.goToMealPlan(listId),
    goToMealPlanAddToList: (listId: string) =>
      navigation.goToMealPlanAddToList(listId),
    goToFrequentItems: (listId: string) => navigation.goToFrequentItems(listId),

    // Recipe navigation
    goToRecipe: (recipeId: string, listId?: string) =>
      navigation.goToRecipe(recipeId, listId),
    goToCreateRecipeManual: (listId?: string, name?: string) =>
      navigation.goToCreateRecipeManual(listId, name),
    goToCreateRecipeImport: (listId?: string) =>
      navigation.goToCreateRecipeImport(listId),
    goToEditRecipe: (recipeId: string, listId?: string) =>
      navigation.goToEditRecipe(recipeId, listId),
  };
}

/**
 * Navigation actions that can be used with router.push/replace
 * These return the correct URL strings for expo-router
 */
export const navActions = {
  // Tab navigation
  goToList: (listId?: string) => buildListUrl(listId ? { listId } : undefined),
  goToRecipes: (listId?: string) =>
    buildRecipesUrl(listId ? { listId } : undefined),

  // Meal plan view navigation
  goToMealPlan: (listId: string) => buildMealPlanUrl({ listId }),
  goToMealPlanAddToList: (listId: string) =>
    buildMealPlanAddToListUrl({ listId }),
  goToFrequentItems: (listId: string) => buildFrequentItemsSheetUrl({ listId }),

  // Recipe navigation
  goToRecipe: (recipeId: string, listId?: string) =>
    buildRecipeUrl({ recipeId, listId }),
  goToCreateRecipeManual: (listId?: string, name?: string) =>
    buildCreateRecipeManualUrl({ listId, name }),
  goToCreateRecipeImport: (listId?: string) =>
    buildCreateRecipeImportUrl({ listId }),
  goToEditRecipe: (recipeId: string, listId?: string) =>
    buildEditRecipeUrl({ recipeId, listId }),
} as const;

/**
 * URL constants for easy reference
 */
export const ROUTES = {
  TABS: {
    LIST: '/(tabs)',
    RECIPES: '/recipes',
  },
  LIST: '/(tabs)',
  MEAL_PLAN: {
    VIEW: (listId: string) =>
      `/(tabs)?listId=${encodeURIComponent(listId)}&view=meal-plan`,
    LEGACY: (listId: string) => `/meal-plan/${listId}`,
    ADD_TO_LIST: (listId: string) => `/meal-plan/${listId}/add-to-list`,
  },
  FREQUENT_ITEMS: {
    SHEET: (listId: string) => `/frequent-items/${listId}`,
  },
  RECIPES: {
    INDEX: '/recipes',
    DETAIL: (recipeId: string) => `/recipes/${recipeId}`,
    CREATE_MANUAL: '/recipes/create/manual',
    CREATE_IMPORT: '/recipes/create/import',
    EDIT: (recipeId: string) => `/recipes/edit/${recipeId}`,
  },
} as const;
