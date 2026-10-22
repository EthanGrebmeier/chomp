import { describe, expect, it } from 'vitest';

import {
  countUncheckedLinkedGroceryItems,
  formatUncheckedLinkedGroceryItemsRemovalNotice,
  withUncheckedLinkedGroceryItemsNotice,
} from '../unchecked-linked-grocery-items';

const unchecked = { isChecked: false, isDeleted: false };
const checked = { isChecked: true, isDeleted: false };
const softDeleted = { isChecked: false, isDeleted: true };

describe('countUncheckedLinkedGroceryItems', () => {
  it('counts only unchecked, live linked items across recipes and items', () => {
    expect(
      countUncheckedLinkedGroceryItems({
        recipes: [
          {
            ingredient_snapshots: [
              { grocery_item: unchecked },
              { grocery_item: checked },
              { grocery_item: softDeleted },
              { grocery_item: null },
              {},
            ],
          },
          { ingredient_snapshots: [{ grocery_item: unchecked }] },
          {},
        ],
        items: [
          { grocery_item: unchecked },
          { grocery_item: checked },
          { grocery_item: null },
        ],
      })
    ).toBe(3);
  });

  it('is zero for no entries', () => {
    expect(countUncheckedLinkedGroceryItems({})).toBe(0);
  });
});

describe('formatUncheckedLinkedGroceryItemsRemovalNotice', () => {
  it('omits the notice when nothing is removed', () => {
    expect(formatUncheckedLinkedGroceryItemsRemovalNotice(0)).toBeNull();
  });

  it('pluralizes the item count', () => {
    expect(formatUncheckedLinkedGroceryItemsRemovalNotice(1)).toBe(
      'This also removes 1 unchecked item from your grocery list.'
    );
    expect(formatUncheckedLinkedGroceryItemsRemovalNotice(3)).toBe(
      'This also removes 3 unchecked items from your grocery list.'
    );
  });
});

describe('withUncheckedLinkedGroceryItemsNotice', () => {
  it('appends the notice only when the count is positive', () => {
    expect(withUncheckedLinkedGroceryItemsNotice('Delete?', 0)).toBe('Delete?');
    expect(withUncheckedLinkedGroceryItemsNotice('Delete?', 2)).toBe(
      'Delete?\n\nThis also removes 2 unchecked items from your grocery list.'
    );
  });
});
