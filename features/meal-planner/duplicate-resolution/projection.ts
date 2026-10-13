import {
  applyDefaultStoreToStackableIngredients,
  type DefaultStoreForStacking,
} from '../../recipes/instant/stack-recipe-ingredients-plan';
import {
  type MealPlanToListProjectionInput,
  projectMealPlanRecipeToListRows,
} from '../instant/meal-plan-to-list-projection';

import type { IncomingDuplicateItem } from './types';

/**
 * Snapshot IDs are optional for pre-create reviews. Source ingredient IDs stay
 * distinct, and callers must provide batch-unique IDs if reviewing many meals.
 */
export const projectRecipeDuplicateInputs = ({
  defaultStore,
  ...projection
}: MealPlanToListProjectionInput & {
  defaultStore?: DefaultStoreForStacking | null;
}): IncomingDuplicateItem[] =>
  applyDefaultStoreToStackableIngredients(
    projectMealPlanRecipeToListRows(projection),
    defaultStore
  ).map(
    ({
      sourceRecipeIngredientId,
      name,
      quantity,
      unit,
      category,
      notes,
      storeId,
      recipeId,
    }) => ({
      sourceId: sourceRecipeIngredientId,
      sourceKind: 'recipe-ingredient',
      name,
      quantity,
      unit,
      category,
      notes,
      storeId: storeId ?? null,
      recipeId,
    })
  );

export const projectStandaloneDuplicateInput = (
  item: Omit<IncomingDuplicateItem, 'sourceKind' | 'recipeId'>,
  defaultStore?: DefaultStoreForStacking | null
): IncomingDuplicateItem => {
  const [projected] = applyDefaultStoreToStackableIngredients(
    [{ ...item, storeId: item.storeId ?? undefined }],
    defaultStore
  );
  return { ...projected, sourceKind: 'meal-plan-item' };
};
