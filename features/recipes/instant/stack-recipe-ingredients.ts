import { id, tx } from '@instantdb/react-native';

import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';

import {
  applyDefaultStoreToStackableIngredients,
  ConflictResolution,
  DefaultStoreForStacking,
  IngredientConflict,
  planIngredientStacking,
  StackableIngredientInput,
} from './stack-recipe-ingredients-plan';
export type {
  AggregatedIngredient,
  ConflictResolution,
  DefaultStoreForStacking,
  IngredientConflict,
  ExistingIngredientForStacking,
  StackableIngredientInput,
} from './stack-recipe-ingredients-plan';
export {
  buildIngredientMatchKey,
  buildIngredientNameKey,
  buildStoreNameKey,
  applyDefaultStoreToStackableIngredients,
  planIngredientStacking,
} from './stack-recipe-ingredients-plan';

type ExistingGroceryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string | null;
  notes?: string | null;
  updatedAt?: string;
  grocery_list?: { id: string } | null;
  store?: { id: string; name: string } | null;
  isChecked: boolean;
  isDeleted?: boolean;
};

type AddIngredientsWithStackingArgs = {
  listId: string;
  ingredients: StackableIngredientInput[];
  defaultStore?: DefaultStoreForStacking | null;
  conflictResolution?: ConflictResolution;
};

export type AddIngredientsWithStackingResult = {
  requiresConflictResolution: boolean;
  conflicts: IngredientConflict[];
  stackedCount: number;
  createdCount: number;
};

export const addIngredientsWithStacking = async ({
  listId,
  ingredients,
  defaultStore,
  conflictResolution = 'prompt',
}: AddIngredientsWithStackingArgs): Promise<AddIngredientsWithStackingResult> => {
  const ingredientsWithDefaultStore = applyDefaultStoreToStackableIngredients(
    ingredients,
    defaultStore
  );

  if (ingredientsWithDefaultStore.length === 0) {
    return {
      requiresConflictResolution: false,
      conflicts: [],
      stackedCount: 0,
      createdCount: 0,
    };
  }

  const now = new Date().toISOString();
  const result = await db.queryOnce({
    grocery_items: {
      grocery_list: {},
      store: {},
    },
  });

  const existingItems = (result.data.grocery_items || []).filter(
    item =>
      item.grocery_list?.id === listId &&
      !item.isDeleted &&
      typeof item.quantity === 'number'
  ) as ExistingGroceryItem[];

  const { quantityUpdates, createEntries, conflicts } = planIngredientStacking({
    existingItems: existingItems.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      isChecked: item.isChecked,
      category: item.category,
      updatedAt: item.updatedAt,
      storeName: item.store?.name,
      storeId: item.store?.id,
    })),
    ingredients: ingredientsWithDefaultStore,
    conflictResolution,
  });

  if (conflicts.length > 0 && conflictResolution === 'prompt') {
    return {
      requiresConflictResolution: true,
      conflicts,
      stackedCount: quantityUpdates.size,
      createdCount: createEntries.length,
    };
  }

  const transactions = [];

  for (const [itemId, quantityToAdd] of quantityUpdates.entries()) {
    const existingItem = existingItems.find(item => item.id === itemId);
    if (!existingItem) continue;

    transactions.push(
      tx.grocery_items[itemId].update(
        trimStringFields({
          quantity: existingItem.quantity + quantityToAdd,
          updatedAt: now,
        })
      )
    );
  }

  for (const ingredient of createEntries) {
    const itemId = id();
    transactions.push(
      tx.grocery_items[itemId].update(
        trimStringFields({
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          notes: ingredient.notes,
          category: ingredient.category,
          isChecked: false,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        })
      ),
      tx.grocery_items[itemId].link({
        grocery_list: listId,
      })
    );

    if (ingredient.storeId) {
      transactions.push(
        tx.grocery_items[itemId].link({
          store: ingredient.storeId,
        })
      );
    }

    if (ingredient.recipeIds.size === 1) {
      const [recipeId] = [...ingredient.recipeIds];
      if (recipeId) {
        transactions.push(
          tx.grocery_items[itemId].link({
            recipe: recipeId,
          })
        );
      }
    }
  }

  if (transactions.length > 0) {
    await db.transact(transactions);
  }

  return {
    requiresConflictResolution: false,
    conflicts: [],
    stackedCount: quantityUpdates.size,
    createdCount: createEntries.length,
  };
};
