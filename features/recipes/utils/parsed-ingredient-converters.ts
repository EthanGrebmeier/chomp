import { BaseGroceryItem } from '@/features/grocery-list/types';

import { IngredientCategory, ParsedIngredient } from '../api/types';

/**
 * Convert a ParsedIngredient to a BaseGroceryItem for use with ItemSheetProvider.
 * Handles null values by providing sensible defaults.
 * Note: Category is expected to already be normalized by the API response handler.
 */
export function parsedIngredientToBaseGroceryItem(
  ingredient: ParsedIngredient
): BaseGroceryItem {
  return {
    name: ingredient.name,
    quantity: ingredient.quantity ?? 1,
    unit: ingredient.unit ?? 'each',
    category: ingredient.category,
    notes: ingredient.notes ?? undefined,
  };
}

/**
 * Convert a BaseGroceryItem back to a ParsedIngredient.
 * Preserves the original category type to maintain consistency.
 *
 * @param item - The BaseGroceryItem from the form
 * @param originalCategory - The original category from the ParsedIngredient (preserved through edit cycle)
 */
export function baseGroceryItemToParsedIngredient(
  item: BaseGroceryItem,
  originalCategory: IngredientCategory
): ParsedIngredient {
  return {
    name: item.name.trim(),
    quantity: item.quantity,
    unit: item.unit,
    // Use the form category if set, otherwise preserve original
    category: (item.category as IngredientCategory) ?? originalCategory,
    notes: item.notes ?? null,
  };
}
