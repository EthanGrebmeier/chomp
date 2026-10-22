import { describe, expect, it } from 'vitest';
import {
  getCanonicalSnapshots,
  getIngredientShoppingStatus,
  getMealPlanShoppingState,
  isHistory,
  isOff,
  isPending,
  isPurchased,
  isVisible,
} from '../shopping-state';

const pending = { isChecked: false, isDeleted: false };
const purchased = { isChecked: true, isDeleted: false };
const cleared = { isChecked: true, isDeleted: true };
const removed = { isChecked: false, isDeleted: true };
const snapshot = (
  sourceRecipeIngredientId: string,
  grocery_item = pending,
  isSelected = true
) => ({ sourceRecipeIngredientId, grocery_item, isSelected });
const recipe = (ingredient_snapshots: ReturnType<typeof snapshot>[]) => ({
  recipe: { recipe_ingredients: [{ id: 'rice' }, { id: 'salt' }] },
  ingredient_snapshots,
});

describe('shopping status', () => {
  it.each([
    [undefined, false, false, true, false, false, 'unselected'],
    [null, false, false, true, false, false, 'unselected'],
    [pending, true, false, false, false, true, 'pending'],
    [purchased, false, true, false, true, true, 'purchased'],
    [cleared, false, true, true, true, false, 'purchased'],
    [removed, false, true, true, false, false, 'removed'],
  ] as const)(
    'derives status for %j',
    (item, needsBuying, history, off, bought, visible, status) => {
      expect(isPending(item)).toBe(needsBuying);
      expect(isHistory(item)).toBe(history);
      expect(isOff(item)).toBe(off);
      expect(isPurchased(item)).toBe(bought);
      expect(isVisible(item)).toBe(visible);
      expect(getIngredientShoppingStatus(item)).toBe(status);
    }
  );

  it('handles an item with an entirely absent grocery_item property', () => {
    expect(getMealPlanShoppingState({})).toMatchObject({
      isShownOnGroceryList: false,
      includedCount: 1,
      purchasedCount: 0,
    });
  });

  it('includes visible checked items in visibility, but not cleared purchases', () => {
    expect(getMealPlanShoppingState({ grocery_item: purchased })).toMatchObject(
      { isShownOnGroceryList: true, allPurchased: true }
    );
    expect(getMealPlanShoppingState({ grocery_item: cleared })).toMatchObject({
      isShownOnGroceryList: false,
      allPurchased: true,
      status: 'all-purchased',
    });
  });

  it('distinguishes mixed pending, purchased and cleared ingredients', () => {
    expect(
      getMealPlanShoppingState(
        recipe([snapshot('rice', cleared), snapshot('salt')])
      )
    ).toEqual({
      isShownOnGroceryList: true,
      visibleCount: 1,
      pendingCount: 1,
      purchasedCount: 1,
      includedCount: 2,
      allPurchased: false,
      status: 'partial',
    });
  });

  it('reports completion even after all purchases were cleared', () => {
    expect(
      getMealPlanShoppingState(
        recipe([snapshot('rice', cleared), snapshot('salt', cleared)])
      )
    ).toMatchObject({
      isShownOnGroceryList: false,
      allPurchased: true,
      purchasedCount: 2,
      status: 'all-purchased',
    });
  });

  it('uses the first snapshot per current source and ignores orphans', () => {
    const snapshots = [
      snapshot('rice', cleared),
      snapshot('rice'),
      snapshot('orphan'),
    ];
    expect(getCanonicalSnapshots([{ id: 'rice' }], snapshots)).toEqual([
      snapshots[0],
    ]);
    expect(getMealPlanShoppingState(recipe(snapshots))).toMatchObject({
      visibleCount: 0,
      purchasedCount: 1,
      includedCount: 1,
    });
  });

  it('counts visible legacy links even when their snapshot is deselected', () => {
    expect(
      getMealPlanShoppingState(recipe([snapshot('rice', pending, false)]))
    ).toMatchObject({ isShownOnGroceryList: true, visibleCount: 1 });
  });

  it('purchased history wins over an inconsistent deselected flag', () => {
    expect(
      getMealPlanShoppingState(recipe([snapshot('rice', cleared, false)]))
    ).toMatchObject({
      purchasedCount: 1,
      includedCount: 1,
      allPurchased: true,
    });
  });

  it('handles empty recipes without reporting completion', () => {
    expect(getMealPlanShoppingState(recipe([]))).toMatchObject({
      isShownOnGroceryList: false,
      allPurchased: false,
      includedCount: 0,
    });
  });

  it('checking then unchecking restores the pending status', () => {
    expect(getIngredientShoppingStatus(purchased)).toBe('purchased');
    expect(getIngredientShoppingStatus(pending)).toBe('pending');
  });
});
