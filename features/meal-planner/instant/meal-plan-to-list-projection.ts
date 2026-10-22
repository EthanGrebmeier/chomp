import { StackableIngredientInput } from '../../recipes/instant/stack-recipe-ingredients';

type RecipeIngredientWithStore = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  store?: { id: string; name?: string | null } | null;
};

type SnapshotRowWithStore = {
  sourceRecipeIngredientId: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  isSelected: boolean;
  isQuantityOverridden: boolean;
  store?: { id: string; name?: string | null } | null;
};

export type MealPlanToListProjectionInput = {
  recipeId: string;
  servings: number;
  sourceIngredients: RecipeIngredientWithStore[];
  snapshotRows: SnapshotRowWithStore[];
};

export type MealPlanRecipeListProjectionRow = StackableIngredientInput & {
  /** Recipe ingredient the row was projected from. */
  sourceRecipeIngredientId: string;
};

/**
 * Projects a meal-plan recipe's reconciled snapshot rows into grocery inputs,
 * tagging each row with the recipe ingredient it came from so callers can map
 * it back to its snapshot row (e.g. to link a grocery item one-to-one).
 */
export const projectMealPlanRecipeToListRows = ({
  recipeId,
  servings,
  sourceIngredients,
  snapshotRows,
}: MealPlanToListProjectionInput): MealPlanRecipeListProjectionRow[] => {
  const safeServings = servings > 0 ? servings : 1;
  const snapshotsBySourceId = new Map(
    snapshotRows.map(snapshot => [snapshot.sourceRecipeIngredientId, snapshot])
  );

  return sourceIngredients.flatMap(sourceIngredient => {
    const snapshot = snapshotsBySourceId.get(sourceIngredient.id);
    const isSelected = snapshot?.isSelected ?? true;
    if (!isSelected) {
      return [];
    }

    const quantity = snapshot?.isQuantityOverridden
      ? snapshot.quantity
      : sourceIngredient.quantity * safeServings;

    return [
      {
        sourceRecipeIngredientId: sourceIngredient.id,
        name: snapshot?.name ?? sourceIngredient.name,
        quantity,
        unit: snapshot?.unit ?? sourceIngredient.unit,
        notes: snapshot?.notes ?? sourceIngredient.notes,
        category: snapshot?.category ?? sourceIngredient.category,
        storeName: snapshot?.store?.name ?? sourceIngredient.store?.name,
        storeId: snapshot?.store?.id ?? sourceIngredient.store?.id,
        recipeId,
      },
    ];
  });
};

/**
 * Projects a meal-plan recipe's reconciled snapshot rows into stackable grocery inputs.
 */
export const projectMealPlanRecipeToListInputs = (
  input: MealPlanToListProjectionInput
): StackableIngredientInput[] =>
  projectMealPlanRecipeToListRows(input).map(
    ({ sourceRecipeIngredientId: _sourceRecipeIngredientId, ...row }) => row
  );
