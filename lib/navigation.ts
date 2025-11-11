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
 * router.push(navigation.goToList('list-123', { autofocus: true }));
 * router.push(navigation.goToMealPlan('plan-456'));
 * router.push(navigation.goToRecipe('recipe-789'));
 *
 * // Using the navActions (alternative API)
 * import { navActions } from '@/lib/navigation';
 *
 * router.push(navActions.goToList('list-123', { autofocus: true }));
 *
 * // Using the hook in components
 * import { useNavigation } from '@/lib/navigation';
 *
 * const nav = useNavigation();
 * nav.goToList('list-123', { autofocus: true });
 */

// Base route types
export type TabRoute = 'list' | 'plans' | 'recipes';

// Dynamic route parameters
export interface MealPlanParams {
  mealPlanId: string;
  autofocus?: boolean;
}

export interface RecipeParams {
  recipeId: string;
  autofocus?: boolean;
}

// Navigation options
export interface NavigationOptions {
  autofocus?: boolean;
  replace?: boolean;
}

/**
 * Builds a URL for a specific tab
 */
export function buildTabUrl(tab: TabRoute) {
  return `/(tabs)/${tab}` as const;
}

/**
 * Builds a URL for the single grocery list page
 */
export function buildListUrl() {
  return `/(tabs)/list` as const;
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
  const { recipeId, autofocus } = params;
  const query = autofocus ? '?autofocus=true' : '';
  return `/recipes/${recipeId}${query}` as const;
}

/**
 * Navigation helper functions that can be used with expo-router
 */
export const navigation = {
  // Tab navigation
  goToList: () => buildListUrl(),
  goToPlans: () => buildTabUrl('plans'),
  goToRecipes: () => buildTabUrl('recipes'),

  // Meal plan navigation
  goToMealPlan: (mealPlanId: string, options?: NavigationOptions) =>
    buildMealPlanUrl({ mealPlanId, autofocus: options?.autofocus }),

  // Recipe navigation
  goToRecipe: (recipeId: string, options?: NavigationOptions) =>
    buildRecipeUrl({ recipeId, autofocus: options?.autofocus }),
} as const;

/**
 * Type-safe navigation hook that can be used in components
 * This provides a more convenient API for navigation
 */
export function useNavigation() {
  return {
    // Tab navigation
    goToList: () => navigation.goToList(),
    goToPlans: () => navigation.goToPlans(),
    goToRecipes: () => navigation.goToRecipes(),

    // Meal plan navigation
    goToMealPlan: (mealPlanId: string, options?: NavigationOptions) =>
      navigation.goToMealPlan(mealPlanId, options),

    // Recipe navigation
    goToRecipe: (recipeId: string, options?: NavigationOptions) =>
      navigation.goToRecipe(recipeId, options),
  };
}

/**
 * Navigation actions that can be used with router.push/replace
 * These return the correct URL strings for expo-router
 */
export const navActions = {
  // Tab navigation
  goToList: () => buildListUrl(),
  goToPlans: () => buildTabUrl('plans'),
  goToRecipes: () => buildTabUrl('recipes'),

  // Meal plan navigation
  goToMealPlan: (mealPlanId: string, options?: NavigationOptions) =>
    buildMealPlanUrl({ mealPlanId, autofocus: options?.autofocus }),

  // Recipe navigation
  goToRecipe: (recipeId: string, options?: NavigationOptions) =>
    buildRecipeUrl({ recipeId, autofocus: options?.autofocus }),
} as const;

/**
 * URL constants for easy reference
 */
export const ROUTES = {
  TABS: {
    LIST: '/(tabs)/list',
    PLANS: '/(tabs)/plans',
    RECIPES: '/(tabs)/recipes',
  },
  LIST: '/(tabs)/list',
  PLANS: {
    INDEX: '/(tabs)/plans',
    DETAIL: (mealPlanId: string) => `/(tabs)/plans/${mealPlanId}`,
  },
  RECIPES: {
    INDEX: '/(tabs)/recipes',
    DETAIL: (recipeId: string) => `/(tabs)/recipes/${recipeId}`,
  },
} as const;
