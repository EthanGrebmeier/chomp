export type StackableIngredientInput = {
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  storeId?: string;
  recipeId?: string;
};

export type ConflictResolution = 'prompt' | 'increment' | 'separate';

export type IngredientConflict = {
  ingredientName: string;
  quantity: number;
  unit: string;
  category?: string | null;
  storeId?: string;
};

export type ExistingIngredientForStacking = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string | null;
  updatedAt?: string;
  storeId?: string;
};

export type AggregatedIngredient = {
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  storeId?: string;
  recipeIds: Set<string>;
};

type PlannedIngredientStacking = {
  quantityUpdates: Map<string, number>;
  createEntries: AggregatedIngredient[];
  conflicts: IngredientConflict[];
};

const normalizeToken = (value?: string | null): string =>
  (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

export const buildIngredientNameKey = (name: string): string =>
  normalizeToken(name);

export const buildIngredientMatchKey = ({
  name,
  unit,
  category,
  storeId,
}: {
  name: string;
  unit: string;
  category?: string | null;
  storeId?: string;
}): string =>
  `${buildIngredientNameKey(name)}|${normalizeToken(unit)}|${normalizeToken(category)}|${storeId ?? ''}`;

const byMostRecentlyUpdated = (
  left: Pick<ExistingIngredientForStacking, 'updatedAt'>,
  right: Pick<ExistingIngredientForStacking, 'updatedAt'>
) => {
  const leftTime = left.updatedAt ? Date.parse(left.updatedAt) : 0;
  const rightTime = right.updatedAt ? Date.parse(right.updatedAt) : 0;
  return rightTime - leftTime;
};

export const planIngredientStacking = ({
  existingItems,
  ingredients,
  conflictResolution,
}: {
  existingItems: ExistingIngredientForStacking[];
  ingredients: StackableIngredientInput[];
  conflictResolution: ConflictResolution;
}): PlannedIngredientStacking => {
  const existingByMatchKey = new Map<string, ExistingIngredientForStacking>();
  const existingByNameKey = new Map<string, ExistingIngredientForStacking[]>();

  for (const item of existingItems) {
    const matchKey = buildIngredientMatchKey({
      name: item.name,
      unit: item.unit,
      category: item.category,
      storeId: item.storeId,
    });
    const current = existingByMatchKey.get(matchKey);
    if (!current || byMostRecentlyUpdated(current, item) > 0) {
      existingByMatchKey.set(matchKey, item);
    }

    const nameKey = buildIngredientNameKey(item.name);
    const currentNameMatches = existingByNameKey.get(nameKey) ?? [];
    currentNameMatches.push(item);
    currentNameMatches.sort(byMostRecentlyUpdated);
    existingByNameKey.set(nameKey, currentNameMatches);
  }

  const aggregated = new Map<string, AggregatedIngredient>();
  for (const ingredient of ingredients) {
    const key = buildIngredientMatchKey(ingredient);
    const existing = aggregated.get(key);
    if (existing) {
      existing.quantity += ingredient.quantity;
      if (!existing.notes && ingredient.notes) {
        existing.notes = ingredient.notes;
      }
      if (ingredient.recipeId) {
        existing.recipeIds.add(ingredient.recipeId);
      }
      continue;
    }

    aggregated.set(key, {
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      notes: ingredient.notes,
      category: ingredient.category,
      storeId: ingredient.storeId,
      recipeIds: ingredient.recipeId ? new Set([ingredient.recipeId]) : new Set(),
    });
  }

  const quantityUpdates = new Map<string, number>();
  const createEntries: AggregatedIngredient[] = [];
  const conflicts: IngredientConflict[] = [];

  for (const aggregatedIngredient of aggregated.values()) {
    const exactKey = buildIngredientMatchKey(aggregatedIngredient);
    const exactMatch = existingByMatchKey.get(exactKey);

    if (exactMatch) {
      quantityUpdates.set(
        exactMatch.id,
        (quantityUpdates.get(exactMatch.id) ?? 0) + aggregatedIngredient.quantity
      );
      continue;
    }

    const nameMatches =
      existingByNameKey.get(buildIngredientNameKey(aggregatedIngredient.name)) ??
      [];

    if (nameMatches.length > 0) {
      conflicts.push({
        ingredientName: aggregatedIngredient.name,
        quantity: aggregatedIngredient.quantity,
        unit: aggregatedIngredient.unit,
        category: aggregatedIngredient.category,
        storeId: aggregatedIngredient.storeId,
      });

      if (conflictResolution === 'increment') {
        const bestNameMatch = nameMatches[0];
        quantityUpdates.set(
          bestNameMatch.id,
          (quantityUpdates.get(bestNameMatch.id) ?? 0) +
            aggregatedIngredient.quantity
        );
      } else if (conflictResolution === 'separate') {
        createEntries.push(aggregatedIngredient);
      }

      continue;
    }

    createEntries.push(aggregatedIngredient);
  }

  return {
    quantityUpdates,
    createEntries,
    conflicts,
  };
};
