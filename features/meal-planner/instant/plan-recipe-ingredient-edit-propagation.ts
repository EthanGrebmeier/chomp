import type { DefaultStoreForStacking } from '../../recipes/instant/stack-recipe-ingredients-plan';

import {
  type MealPlanRecipeSyncRow,
  toMealPlanRecipeSyncContext,
} from './meal-plan-entry-sync-context';
import type { SnapshotRowToCreateWithId } from './plan-meal-plan-entry-ignored';
import {
  type MealPlanListSyncPlan,
  type MealPlanListSyncSource,
  type MealPlanRecipeEntryForSync,
  type MealPlanSnapshotRowForSync,
  planMealPlanListSync,
} from './plan-meal-plan-list-sync';
import { planMealPlanSnapshotReconciliation } from './plan-meal-plan-snapshot-reconciliation';

/** A recipe ingredient as the meal plan sees it (with its store). */
export type RecipeIngredientForPropagation =
  MealPlanRecipeEntryForSync['sourceIngredients'][number];

/**
 * A change to one of a recipe's ingredients. `update` carries the ingredient
 * as it is after the edit; the pre-edit ingredient is read from the loaded
 * meal plan rows.
 */
export type RecipeIngredientEdit =
  | { type: 'add'; ingredient: RecipeIngredientForPropagation }
  | { type: 'update'; ingredient: RecipeIngredientForPropagation }
  | { type: 'remove'; ingredientId: string };

/** New values for a snapshot row that follows its recipe ingredient. */
export type SnapshotRowFollowUpdate = {
  snapshotRowId: string;
  fields: {
    name: string;
    quantity: number;
    unit: string;
    notes: string | null;
    category: string | null;
  };
  storeId: string | null;
  previousStoreId: string | null;
};

export type RecipeIngredientEditEntryPlan = {
  /** List the entry's linked items live on. */
  listId: string;
  mealPlanRecipeId: string;
  snapshotRowsToCreate: SnapshotRowToCreateWithId[];
  snapshotRowUpdates: SnapshotRowFollowUpdate[];
  snapshotRowIdsToDelete: string[];
  listSync: MealPlanListSyncPlan;
};

export type PlanRecipeIngredientEditPropagationArgs = {
  /**
   * Meal plan recipes using the edited recipe, loaded before the edit so
   * `recipe.recipe_ingredients` holds the pre-edit ingredients. Callers only
   * pass rows on lists the editor is a member of.
   */
  recipeRows: MealPlanRecipeSyncRow[];
  edit: RecipeIngredientEdit;
  /** List default store, applied to linked items without a store. */
  defaultStore?: DefaultStoreForStacking | null;
  /** Id factory for new snapshot rows. */
  createId: () => string;
};

const normalizeText = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/**
 * A snapshot field follows the recipe ingredient while it still holds the
 * ingredient's pre-edit value; a different value is the planner's own
 * override and is kept.
 */
const follows = (
  snapshotValue: string | null | undefined,
  previousValue: string | null | undefined
) => normalizeText(snapshotValue) === normalizeText(previousValue);

/**
 * Works out a snapshot row's new values after its recipe ingredient changed,
 * or null when nothing it follows changed. Quantity follows unless it is
 * overridden (non-overridden snapshots hold the per-serving quantity).
 */
export const planSnapshotRowFollowUpdate = (
  row: Pick<
    MealPlanSnapshotRowForSync,
    | 'id'
    | 'name'
    | 'quantity'
    | 'unit'
    | 'notes'
    | 'category'
    | 'isQuantityOverridden'
    | 'store'
  >,
  previous: RecipeIngredientForPropagation,
  next: RecipeIngredientForPropagation
): SnapshotRowFollowUpdate | null => {
  const pick = (
    snapshotValue: string | null | undefined,
    previousValue: string | null | undefined,
    nextValue: string | null | undefined
  ) =>
    follows(snapshotValue, previousValue)
      ? normalizeText(nextValue)
      : normalizeText(snapshotValue);

  const previousStoreId = row.store?.id ?? null;
  const storeId =
    previousStoreId === (previous.store?.id ?? null)
      ? (next.store?.id ?? null)
      : previousStoreId;
  const fields = {
    name: pick(row.name, previous.name, next.name) ?? row.name,
    quantity: row.isQuantityOverridden ? row.quantity : next.quantity,
    unit: pick(row.unit, previous.unit, next.unit) ?? row.unit,
    notes: pick(row.notes, previous.notes, next.notes),
    category: pick(row.category, previous.category, next.category),
  };

  const isUnchanged =
    fields.name === row.name &&
    fields.quantity === row.quantity &&
    fields.unit === row.unit &&
    fields.notes === normalizeText(row.notes) &&
    fields.category === normalizeText(row.category) &&
    storeId === previousStoreId;

  return isUnchanged
    ? null
    : { snapshotRowId: row.id, fields, storeId, previousStoreId };
};

const editedIngredientId = (edit: RecipeIngredientEdit) =>
  edit.type === 'remove' ? edit.ingredientId : edit.ingredient.id;

const applyEdit = (
  ingredients: RecipeIngredientForPropagation[],
  edit: RecipeIngredientEdit
): RecipeIngredientForPropagation[] => {
  switch (edit.type) {
    case 'add':
      return ingredients.some(
        ingredient => ingredient.id === edit.ingredient.id
      )
        ? ingredients
        : [...ingredients, edit.ingredient];
    case 'update':
      return ingredients.map(ingredient =>
        ingredient.id === edit.ingredient.id ? edit.ingredient : ingredient
      );
    case 'remove':
      return ingredients.filter(
        ingredient => ingredient.id !== edit.ingredientId
      );
  }
};

const keepSources = (
  plan: MealPlanListSyncPlan,
  snapshotRowIds: ReadonlySet<string>
): MealPlanListSyncPlan => {
  const isAffected = ({ source }: { source: MealPlanListSyncSource }) =>
    source.type === 'snapshot' && snapshotRowIds.has(source.snapshotId);

  return {
    creates: plan.creates.filter(isAffected),
    updates: plan.updates.filter(isAffected),
    deletes: plan.deletes.filter(isAffected),
    unlinks: plan.unlinks.filter(isAffected),
  };
};

const isEntryPlanEmpty = (plan: RecipeIngredientEditEntryPlan) =>
  plan.snapshotRowsToCreate.length === 0 &&
  plan.snapshotRowUpdates.length === 0 &&
  plan.snapshotRowIdsToDelete.length === 0 &&
  plan.listSync.creates.length === 0 &&
  plan.listSync.updates.length === 0 &&
  plan.listSync.deletes.length === 0 &&
  plan.listSync.unlinks.length === 0;

/**
 * Plans how one recipe ingredient edit reaches every given meal plan entry
 * using the recipe, and their linked grocery items:
 *
 * - add: each entry that isn't ignored gets a selected snapshot row for the
 *   ingredient and a linked list row. Ignored entries get nothing; turning
 *   ignore off backfills the row.
 * - update: snapshot fields that still follow the recipe take the new values
 *   (quantity unless overridden), and unchecked linked items are re-projected.
 * - remove: the ingredient's snapshot rows are deleted with their unchecked
 *   items; checked items are history and only lose the meal plan link.
 *
 * Only the edited ingredient's snapshot rows and linked items are touched, so
 * unrelated drift is left to the reconciler. Pure and tx-free; see
 * `buildRecipeIngredientEditPropagationTransactions`.
 */
export const planRecipeIngredientEditPropagation = ({
  recipeRows,
  edit,
  defaultStore,
  createId,
}: PlanRecipeIngredientEditPropagationArgs): RecipeIngredientEditEntryPlan[] => {
  const ingredientId = editedIngredientId(edit);
  const plans: RecipeIngredientEditEntryPlan[] = [];

  for (const row of recipeRows) {
    const context = toMealPlanRecipeSyncContext(row);
    if (!context) {
      continue;
    }
    const { entry, listId } = context;
    const previousIngredient = entry.sourceIngredients.find(
      ingredient => ingredient.id === ingredientId
    );
    if (edit.type === 'update' && !previousIngredient) {
      continue;
    }

    const plan: RecipeIngredientEditEntryPlan = {
      listId,
      mealPlanRecipeId: entry.id,
      snapshotRowsToCreate: [],
      snapshotRowUpdates: [],
      snapshotRowIdsToDelete: [],
      listSync: { creates: [], updates: [], deletes: [], unlinks: [] },
    };
    const ingredientRows = entry.snapshotRows.filter(
      snapshotRow => snapshotRow.sourceRecipeIngredientId === ingredientId
    );
    let snapshotRows = entry.snapshotRows;

    if (edit.type === 'add' && !entry.ignoredByGroceryList) {
      plan.snapshotRowsToCreate = planMealPlanSnapshotReconciliation({
        sourceIngredients: [edit.ingredient],
        existingSnapshotRows: entry.snapshotRows,
      }).rowsToCreate.map(snapshotRow => ({ ...snapshotRow, id: createId() }));
      snapshotRows = [
        ...snapshotRows,
        ...plan.snapshotRowsToCreate.map(({ storeId, ...snapshotRow }) => ({
          ...snapshotRow,
          store: storeId ? { id: storeId } : null,
          grocery_item: null,
        })),
      ];
    }

    if (edit.type === 'update' && previousIngredient) {
      const updatesById = new Map<string, SnapshotRowFollowUpdate>();
      for (const snapshotRow of ingredientRows) {
        const update = planSnapshotRowFollowUpdate(
          snapshotRow,
          previousIngredient,
          edit.ingredient
        );
        if (update) {
          updatesById.set(snapshotRow.id, update);
        }
      }
      plan.snapshotRowUpdates = [...updatesById.values()];
      snapshotRows = snapshotRows.map(snapshotRow => {
        const update = updatesById.get(snapshotRow.id);
        return update
          ? {
              ...snapshotRow,
              ...update.fields,
              store: update.storeId ? { id: update.storeId } : null,
            }
          : snapshotRow;
      });
    }

    if (edit.type === 'remove') {
      plan.snapshotRowIdsToDelete = ingredientRows.map(
        snapshotRow => snapshotRow.id
      );
    }

    const affectedRowIds = new Set([
      ...ingredientRows.map(snapshotRow => snapshotRow.id),
      ...plan.snapshotRowsToCreate.map(snapshotRow => snapshotRow.id),
    ]);
    plan.listSync = keepSources(
      planMealPlanListSync({
        entry: {
          ...entry,
          sourceIngredients: applyEdit(entry.sourceIngredients, edit),
          snapshotRows,
        },
        defaultStore,
      }),
      affectedRowIds
    );

    if (!isEntryPlanEmpty(plan)) {
      plans.push(plan);
    }
  }

  return plans;
};
