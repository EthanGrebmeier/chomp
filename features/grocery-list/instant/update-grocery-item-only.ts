import { db } from '../../../lib/instant';
import { trimStringFields } from '../../../lib/utils/trim-string-fields';
import { buildLinkedGroceryItemWriteBackTransactions } from '../../meal-planner/instant/build-list-to-meal-plan-write-back-transactions';
import type {
  LinkedGroceryItemPatch,
  MealPlanWriteBackSource,
} from '../../meal-planner/instant/plan-list-to-meal-plan-write-back';
import { GroceryListItem } from '../types';

import { buildStoreLinkTransactions } from './link-store-to-item';

export type UpdateGroceryItemOnlyArgs = {
  itemId: string;
  item: Partial<GroceryListItem> & { storeId?: string };
  currentStoreId?: string;
  currentSavedItemId?: string;
  selectedSavedItemId?: string;
  selectedLocalSavedItemId?: string;
  /**
   * For items linked to the meal plan: the source to write the edit back to,
   * and the fields that changed. Written in the same transaction.
   */
  mealPlanWriteBack?: {
    source: MealPlanWriteBackSource;
    patch: LinkedGroceryItemPatch;
  };
};

export type CheckedStateUpdate = {
  itemId: string;
  isChecked: boolean;
};

/**
 * Writes the grocery_items row, reconciles the grocery_items↔stores link
 * and writes the edit back to the item's meal plan source (if any), all in
 * one transaction. Then performs grocery_items↔saved_items relink when the
 * caller supplies a new cloud suggestion or a local-only match.
 *
 * Intentionally does NOT touch saved_items rows, saved_items↔stores, or the
 * local-saved-item upsert; that surface lives in syncSavedItemFromGroceryItem.
 */
export const updateGroceryItemOnly = async ({
  itemId,
  item,
  currentStoreId,
  currentSavedItemId,
  selectedSavedItemId,
  selectedLocalSavedItemId,
  mealPlanWriteBack,
}: UpdateGroceryItemOnlyArgs) => {
  const { storeId, ...updateData } = item;

  await db.transact([
    db.tx.grocery_items[itemId].update(
      trimStringFields({
        ...updateData,
        category: item.category ?? null,
      })
    ),
    ...buildStoreLinkTransactions({ itemId, storeId, currentStoreId }),
    ...(mealPlanWriteBack
      ? buildLinkedGroceryItemWriteBackTransactions(mealPlanWriteBack)
      : []),
  ]);

  // Preserve existing link unless user explicitly selected a new cloud suggestion.
  const shouldRelink =
    selectedSavedItemId !== undefined &&
    selectedSavedItemId !== currentSavedItemId;
  const shouldUnlinkCloudForLocalSelection =
    !!selectedLocalSavedItemId && !!currentSavedItemId;

  if (shouldRelink) {
    const linkTransactions = [];
    if (currentSavedItemId) {
      linkTransactions.push(
        db.tx.grocery_items[itemId].unlink({
          saved_item: currentSavedItemId,
        })
      );
    }
    linkTransactions.push(
      db.tx.grocery_items[itemId].link({
        saved_item: selectedSavedItemId,
      })
    );
    await db.transact(linkTransactions);
  }

  if (shouldUnlinkCloudForLocalSelection && currentSavedItemId) {
    await db.transact([
      db.tx.grocery_items[itemId].unlink({
        saved_item: currentSavedItemId,
      }),
    ]);
  }
};

export const updateGroceryItemsCheckedState = async (
  updates: CheckedStateUpdate[]
) => {
  if (updates.length === 0) {
    return;
  }

  await db.transact(
    updates.map(({ itemId, isChecked }) =>
      db.tx.grocery_items[itemId].update({
        isChecked,
      })
    )
  );
};
