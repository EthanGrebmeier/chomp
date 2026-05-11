type SourceIngredient = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  store?: { id: string } | null;
};

type SnapshotIngredient = {
  id: string;
  sourceRecipeIngredientId: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  isSelected: boolean;
  isQuantityOverridden: boolean;
  store?: { id: string } | null;
};

export type MealPlanIngredientEditorRow = {
  id: string;
  snapshotRowId?: string;
  sourceRecipeIngredientId: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  isSelected: boolean;
  isQuantityOverridden: boolean;
  storeId?: string;
};

export type MealPlanIngredientSnapshotCreateInput = {
  sourceRecipeIngredientId: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  isSelected: boolean;
  isQuantityOverridden: boolean;
  storeId?: string;
};

export const initializeMealPlanIngredientEditor = (
  sourceIngredients: SourceIngredient[]
): MealPlanIngredientEditorRow[] => {
  return sourceIngredients.map(ingredient => ({
    id: ingredient.id,
    sourceRecipeIngredientId: ingredient.id,
    name: ingredient.name,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    notes: ingredient.notes ?? null,
    category: ingredient.category ?? null,
    isSelected: true,
    isQuantityOverridden: false,
    storeId: ingredient.store?.id,
  }));
};

export const hydrateMealPlanIngredientEditorFromSnapshot = ({
  sourceIngredients,
  snapshotRows,
}: {
  sourceIngredients: SourceIngredient[];
  snapshotRows: SnapshotIngredient[];
}): MealPlanIngredientEditorRow[] => {
  const snapshotsBySourceId = new Map(
    snapshotRows.map(row => [row.sourceRecipeIngredientId, row])
  );

  return sourceIngredients.map(sourceIngredient => {
    const snapshotRow = snapshotsBySourceId.get(sourceIngredient.id);
    if (!snapshotRow) {
      return {
        id: sourceIngredient.id,
        sourceRecipeIngredientId: sourceIngredient.id,
        name: sourceIngredient.name,
        quantity: sourceIngredient.quantity,
        unit: sourceIngredient.unit,
        notes: sourceIngredient.notes ?? null,
        category: sourceIngredient.category ?? null,
        isSelected: true,
        isQuantityOverridden: false,
        storeId: sourceIngredient.store?.id,
      };
    }

    return {
      id: snapshotRow.sourceRecipeIngredientId,
      snapshotRowId: snapshotRow.id,
      sourceRecipeIngredientId: snapshotRow.sourceRecipeIngredientId,
      name: snapshotRow.name,
      quantity: snapshotRow.quantity,
      unit: snapshotRow.unit,
      notes: snapshotRow.notes ?? null,
      category: snapshotRow.category ?? null,
      isSelected: snapshotRow.isSelected,
      isQuantityOverridden: snapshotRow.isQuantityOverridden,
      storeId: snapshotRow.store?.id,
    };
  });
};

export const toggleMealPlanIngredientSelection = (
  rows: MealPlanIngredientEditorRow[],
  sourceRecipeIngredientId: string
): MealPlanIngredientEditorRow[] =>
  rows.map(row =>
    row.sourceRecipeIngredientId === sourceRecipeIngredientId
      ? { ...row, isSelected: !row.isSelected }
      : row
  );

export const toggleAllMealPlanIngredientSelection = (
  rows: MealPlanIngredientEditorRow[]
): MealPlanIngredientEditorRow[] => {
  const shouldSelectAll = rows.some(row => !row.isSelected);
  return rows.map(row => ({ ...row, isSelected: shouldSelectAll }));
};

export const getSelectedSourceIngredientIds = (
  rows: MealPlanIngredientEditorRow[]
): Set<string> =>
  new Set(
    rows
      .filter(row => row.isSelected)
      .map(row => row.sourceRecipeIngredientId)
  );

export const toSnapshotCreateInputs = (
  rows: MealPlanIngredientEditorRow[]
): MealPlanIngredientSnapshotCreateInput[] =>
  rows.map(row => ({
    sourceRecipeIngredientId: row.sourceRecipeIngredientId,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    notes: row.notes ?? null,
    category: row.category ?? null,
    isSelected: row.isSelected,
    isQuantityOverridden: row.isQuantityOverridden,
    storeId: row.storeId,
  }));
