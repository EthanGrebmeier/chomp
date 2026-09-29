import { id, tx } from '@instantdb/react-native';

import { db, type TransactionChunk } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { buildAddEventTransactions } from '../../frequent-items/instant/build-add-event-transactions';

import {
  applyDefaultStoreToStackableIngredients,
  ConflictResolution,
  DefaultStoreForStacking,
  ExistingIngredientForStacking,
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

type BuildStackingTransactionsArgs = {
  listId: string;
  ingredients: StackableIngredientInput[];
  /** Live, non-deleted items already on `listId`. */
  existingItems: ExistingIngredientForStacking[];
  defaultStore?: DefaultStoreForStacking | null;
  conflictResolution?: ConflictResolution;
  now?: string;
};

export type AddIngredientsWithStackingResult = {
  requiresConflictResolution: boolean;
  conflicts: IngredientConflict[];
  stackedCount: number;
  createdCount: number;
};

export type StackingTransactionsResult = AddIngredientsWithStackingResult & {
  transactions: TransactionChunk[];
};

/**
 * Plans an ingredient add against already-loaded list items and returns the
 * transaction chunks without writing them, so callers can batch them with
 * their own writes in a single `db.transact`.
 */
export const buildIngredientStackingTransactions = ({
  listId,
  ingredients,
  existingItems,
  defaultStore,
  conflictResolution = 'prompt',
  now = new Date().toISOString(),
}: BuildStackingTransactionsArgs): StackingTransactionsResult => {
  const ingredientsWithDefaultStore = applyDefaultStoreToStackableIngredients(
    ingredients,
    defaultStore
  );

  const { quantityUpdates, createEntries, conflicts } = planIngredientStacking({
    existingItems,
    ingredients: ingredientsWithDefaultStore,
    conflictResolution,
  });

  if (conflicts.length > 0 && conflictResolution === 'prompt') {
    return {
      requiresConflictResolution: true,
      conflicts,
      stackedCount: quantityUpdates.size,
      createdCount: createEntries.length,
      transactions: [],
    };
  }

  const transactions: TransactionChunk[] = [];
  const existingItemsById = new Map(existingItems.map(item => [item.id, item]));

  for (const [itemId, quantityToAdd] of quantityUpdates.entries()) {
    const existingItem = existingItemsById.get(itemId);
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
      }),
      ...buildAddEventTransactions({
        eventId: itemId,
        listId,
        item: {
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          notes: ingredient.notes ?? undefined,
          category: ingredient.category ?? undefined,
          storeId: ingredient.storeId,
        },
        addedAt: now,
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

  return {
    requiresConflictResolution: false,
    conflicts: [],
    stackedCount: quantityUpdates.size,
    createdCount: createEntries.length,
    transactions,
  };
};

type StackableGroceryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  isChecked: boolean;
  category?: string | null;
  updatedAt?: string;
  store?: { id: string; name?: string | null } | null;
};

/** Maps live grocery items (e.g. from `useGroceryListItems`) into stacking input. */
export const toExistingIngredientsForStacking = (
  items: readonly StackableGroceryItem[]
): ExistingIngredientForStacking[] =>
  items
    .filter(item => typeof item.quantity === 'number')
    .map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      isChecked: item.isChecked,
      category: item.category,
      updatedAt: item.updatedAt,
      storeName: item.store?.name,
      storeId: item.store?.id,
    }));

/**
 * Fetches the live items on a single list for stacking. Scoped server-side so
 * the payload does not grow with soft-deleted items or other lists.
 */
export const fetchExistingIngredientsForStacking = async (
  listId: string
): Promise<ExistingIngredientForStacking[]> => {
  const result = await db.queryOnce({
    grocery_items: {
      $: {
        where: {
          'grocery_list.id': listId,
          isDeleted: false,
        },
      },
      store: {},
    },
  });

  return toExistingIngredientsForStacking(result.data.grocery_items ?? []);
};

type AddIngredientsWithStackingArgs = {
  listId: string;
  ingredients: StackableIngredientInput[];
  defaultStore?: DefaultStoreForStacking | null;
  conflictResolution?: ConflictResolution;
};

export const addIngredientsWithStacking = async ({
  listId,
  ingredients,
  defaultStore,
  conflictResolution = 'prompt',
}: AddIngredientsWithStackingArgs): Promise<AddIngredientsWithStackingResult> => {
  if (ingredients.length === 0) {
    return {
      requiresConflictResolution: false,
      conflicts: [],
      stackedCount: 0,
      createdCount: 0,
    };
  }

  const { transactions, ...result } = buildIngredientStackingTransactions({
    listId,
    ingredients,
    existingItems: await fetchExistingIngredientsForStacking(listId),
    defaultStore,
    conflictResolution,
  });

  if (transactions.length > 0) {
    await db.transact(transactions);
  }

  return result;
};
