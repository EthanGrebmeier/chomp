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
 * router.push(navigation.goToMealPlan('plan-456'));
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
export type TabRoute = 'list' | 'plans' | 'recipes';

// Dynamic route parameters
export interface ListParams {
  listId?: string;
}

export interface MealPlanParams {
  mealPlanId: string;
  autofocus?: boolean;
}

export interface RecipeParams {
  recipeId: string;
}

// Navigation options
export interface NavigationOptions {
  autofocus?: boolean;
  replace?: boolean;
}

/**
 * Builds a URL for a specific tab
 */
export function buildRecipesUrl(): Href {
  return `/(tabs)/recipes` as const;
}

export function buildPlansUrl(): Href {
  return `/plans` as const;
}

/**
 * Builds a URL for the single grocery list page
 */
export function buildListUrl(params?: ListParams): Href {
  const query = params?.listId ? `?listId=${params.listId}` : '';
  return `/(tabs)${query}` as Href;
}

/**
 * Builds a URL for a meal plan detail page
 */
export function buildMealPlanUrl(params: MealPlanParams) {
  const { mealPlanId, autofocus } = params;
  const query = autofocus ? '?autofocus=true' : '';
  return `/plans/${mealPlanId}${query}` as const;
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
export function buildListURL(joinCode: string): string {
  return `https://chompgrocery.com/join-list/${joinCode}`;
}

/**
 * Navigation helper functions that can be used with expo-router
 */
export const navigation = {
  // Tab navigation
  goToList: (listId?: string) => buildListUrl(listId ? { listId } : undefined),
  goToPlans: buildPlansUrl,
  goToRecipes: buildRecipesUrl,

  // Meal plan navigation
  goToMealPlan: (mealPlanId: string, options?: NavigationOptions) =>
    buildMealPlanUrl({ mealPlanId, autofocus: options?.autofocus }),

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
    goToPlans: () => navigation.goToPlans(),
    goToRecipes: () => navigation.goToRecipes(),

    // Meal plan navigation
    goToMealPlan: (mealPlanId: string, options?: NavigationOptions) =>
      navigation.goToMealPlan(mealPlanId, options),

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
  goToPlans: () => buildPlansUrl(),
  goToRecipes: () => buildRecipesUrl(),

  // Meal plan navigation
  goToMealPlan: (mealPlanId: string, options?: NavigationOptions) =>
    buildMealPlanUrl({ mealPlanId, autofocus: options?.autofocus }),

  // Recipe navigation
  goToRecipe: (recipeId: string) => buildRecipeUrl({ recipeId }),
} as const;

/**
 * URL constants for easy reference
 */
export const ROUTES = {
  TABS: {
    LIST: '/(tabs)',
    PLANS: '/(tabs)/plans',
    RECIPES: '/(tabs)/recipes',
  },
  LIST: '/(tabs)',
  PLANS: {
    INDEX: '/(tabs)/plans',
    DETAIL: (mealPlanId: string) => `/(tabs)/plans/${mealPlanId}`,
  },
  RECIPES: {
    INDEX: '/(tabs)/recipes',
    DETAIL: (recipeId: string) => `/(tabs)/recipes/${recipeId}`,
  },
} as const;
