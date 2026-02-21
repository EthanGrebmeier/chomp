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

// Base route types
export type TabRoute = 'list' | 'recipes';

// Dynamic route parameters
export interface ListParams {
  listId?: string;
}

export interface ListMealPlanParams {
  listId: string;
}

export interface RecipeParams {
  recipeId: string;
}

/**
 * Builds a URL for a specific tab
 */
export function buildRecipesUrl(): Href {
  return `/recipes` as const;
}

/**
 * Builds a URL for the single grocery list page
 */
export function buildListUrl(params?: ListParams): Href {
  const query = params?.listId ? `?listId=${params.listId}` : '';
  return `/(tabs)${query}` as Href;
}

export function buildMealPlanSheetUrl(params: ListMealPlanParams): Href {
  const { listId } = params;
  return {
    pathname: '/meal-plan/[listId]',
    params: { listId },
  } as unknown as Href;
}

/**
 * Builds a URL for a recipe detail page
 */
export function buildRecipeUrl(params: RecipeParams) {
  const { recipeId } = params;
  return `/recipes/${recipeId}` as const;
}

/**
 * Builds a deep link URL for sharing a grocery list by join code
 */
export function buildListURL(joinCode: string): string | null {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) return null;
  return `${baseUrl}/join-list/${joinCode}`;
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
  goToRecipes: buildRecipesUrl,

  // Meal plan sheet navigation
  goToMealPlan: (listId: string) => buildMealPlanSheetUrl({ listId }),

  // Recipe navigation
  goToRecipe: (recipeId: string) => buildRecipeUrl({ recipeId }),
} as const;

/**
 * Type-safe navigation hook that can be used in components
 * This provides a more convenient API for navigation
 */
export function useNavigation() {
  return {
    // Tab navigation
    goToList: (listId?: string) => navigation.goToList(listId),
    goToRecipes: () => navigation.goToRecipes(),

    // Meal plan sheet navigation
    goToMealPlan: (listId: string) => navigation.goToMealPlan(listId),

    // Recipe navigation
    goToRecipe: (recipeId: string) => navigation.goToRecipe(recipeId),
  };
}

/**
 * Navigation actions that can be used with router.push/replace
 * These return the correct URL strings for expo-router
 */
export const navActions = {
  // Tab navigation
  goToList: (listId?: string) => buildListUrl(listId ? { listId } : undefined),
  goToRecipes: () => buildRecipesUrl(),

  // Meal plan sheet navigation
  goToMealPlan: (listId: string) => buildMealPlanSheetUrl({ listId }),

  // Recipe navigation
  goToRecipe: (recipeId: string) => buildRecipeUrl({ recipeId }),
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
    SHEET: (listId: string) => `/meal-plan/${listId}`,
  },
  RECIPES: {
    INDEX: '/recipes',
    DETAIL: (recipeId: string) => `/recipes/${recipeId}`,
  },
} as const;
