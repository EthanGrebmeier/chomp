import { describe, expect, it, vi } from 'vitest';

import { getMealPlanShoppingState } from '../../utils/shopping-state';
import { isMealPlanOnly } from '../meal-plan-entry';
import { planMealPlanListSync } from '../plan-meal-plan-list-sync';
import { planMealPlanEntryIgnored } from '../plan-meal-plan-entry-ignored';
import type {
  LinkedGroceryItemForSync,
  MealPlanItemEntryForSync,
  MealPlanRecipeEntryForSync,
  MealPlanSnapshotRowForSync,
} from '../plan-meal-plan-list-sync';

vi.mock('../../../../lib/instant', () => ({ db: {} }));
vi.mock('@instantdb/react-native', () => ({ id: () => 'id', tx: {} }));

const sourceIngredients: MealPlanRecipeEntryForSync['sourceIngredients'] = [
  {
    id: 'source-rice',
    name: 'Rice',
    quantity: 0.5,
    unit: 'cup',
    category: 'Pantry',
    notes: null,
  },
  {
    id: 'source-salt',
    name: 'Salt',
    quantity: 1,
    unit: 'tsp',
    category: 'Pantry',
    notes: null,
  },
];

const snapshotRow = (
  sourceId: string,
  overrides: Partial<MealPlanSnapshotRowForSync> = {}
): MealPlanSnapshotRowForSync => {
  const source = sourceIngredients.find(
    ingredient => ingredient.id === sourceId
  );
  if (!source) throw new Error(`Unknown source ${sourceId}`);
  return {
    id: `snapshot-${sourceId}`,
    sourceRecipeIngredientId: sourceId,
    name: source.name,
    quantity: source.quantity,
    unit: source.unit,
    category: source.category,
    notes: source.notes,
    store: null,
    isSelected: true,
    isQuantityOverridden: false,
    grocery_item: null,
    ...overrides,
  };
};

const linkedItem = (
  id: string,
  overrides: Partial<LinkedGroceryItemForSync> = {}
): LinkedGroceryItemForSync => ({
  id,
  name: 'Rice',
  quantity: 1,
  unit: 'cup',
  category: 'Pantry',
  notes: null,
  isChecked: false,
  isDeleted: false,
  store: null,
  ...overrides,
});

const recipeEntry = (
  overrides: Partial<MealPlanRecipeEntryForSync> = {}
): MealPlanRecipeEntryForSync => ({
  kind: 'recipe',
  id: 'meal-plan-recipe-1',
  recipeId: 'recipe-1',
  servings: 2,
  ignoredByGroceryList: false,
  sourceIngredients,
  snapshotRows: [snapshotRow('source-rice'), snapshotRow('source-salt')],
  ...overrides,
});

const itemEntry = (
  overrides: Partial<MealPlanItemEntryForSync> = {}
): MealPlanItemEntryForSync => ({
  kind: 'item',
  id: 'meal-plan-item-1',
  ignoredByGroceryList: false,
  name: 'Bananas',
  quantity: 6,
  unit: 'each',
  category: 'Produce',
  notes: null,
  store: null,
  grocery_item: null,
  ...overrides,
});

const createIdSequence = () => {
  let next = 0;
  return () => `new-snapshot-${++next}`;
};

const createdSnapshotIds = (
  plan: ReturnType<typeof planMealPlanEntryIgnored>
) =>
  plan.listSync.creates.map(create =>
    create.source.type === 'snapshot' ? create.source.snapshotId : null
  );

describe('planMealPlanEntryIgnored — hiding (ignoring)', () => {
  it('removes pending linked items and soft-deletes checked ones', () => {
    const plan = planMealPlanEntryIgnored({
      entry: recipeEntry({
        snapshotRows: [
          snapshotRow('source-rice', {
            grocery_item: linkedItem('grocery-rice'),
          }),
          snapshotRow('source-salt', {
            grocery_item: linkedItem('grocery-salt', { isChecked: true }),
          }),
        ],
      }),
      ignored: true,
      createId: createIdSequence(),
    });

    expect(plan.listSync).toEqual({
      creates: [],
      updates: [],
      deletes: [
        {
          source: { type: 'snapshot', snapshotId: 'snapshot-source-rice' },
          groceryItemId: 'grocery-rice',
        },
      ],
      unlinks: [],
    });

    expect(plan.softDeletes).toEqual([{ groceryItemId: 'grocery-salt' }]);
  });

  it('leaves the snapshot selection as it is', () => {
    const plan = planMealPlanEntryIgnored({
      entry: recipeEntry({
        snapshotRows: [
          snapshotRow('source-rice', { isSelected: false }),
          snapshotRow('source-salt', {
            grocery_item: linkedItem('grocery-salt'),
          }),
        ],
      }),
      ignored: true,
      createId: createIdSequence(),
    });

    expect(plan.snapshotRowIdsToSelect).toEqual([]);
    expect(plan.snapshotRowsToCreate).toEqual([]);
  });

  it('soft-deletes checked items but not already soft-deleted ones', () => {
    const plan = planMealPlanEntryIgnored({
      entry: recipeEntry({
        snapshotRows: [
          snapshotRow('source-rice', {
            grocery_item: linkedItem('grocery-rice', { isChecked: true }),
          }),
          snapshotRow('source-salt', {
            grocery_item: linkedItem('grocery-salt', {
              isChecked: true,
              isDeleted: true,
            }),
          }),
        ],
      }),
      ignored: true,
      createId: createIdSequence(),
    });

    expect(plan.softDeletes).toEqual([{ groceryItemId: 'grocery-rice' }]);
  });
});

describe('planMealPlanEntryIgnored — showing (un-ignoring)', () => {
  it('restores exactly the selection from before', () => {
    const plan = planMealPlanEntryIgnored({
      entry: recipeEntry({
        ignoredByGroceryList: true,
        snapshotRows: [
          snapshotRow('source-rice'),
          snapshotRow('source-salt', { isSelected: false }),
        ],
      }),
      ignored: false,
      createId: createIdSequence(),
    });

    expect(plan.snapshotRowIdsToSelect).toEqual([]);
    expect(createdSnapshotIds(plan)).toEqual(['snapshot-source-rice']);
    expect(plan.listSync.deletes).toEqual([]);
    expect(plan.softDeletes).toEqual([]);
  });

  it('selects every ingredient when nothing was selected', () => {
    const plan = planMealPlanEntryIgnored({
      entry: recipeEntry({
        ignoredByGroceryList: true,
        snapshotRows: [
          snapshotRow('source-rice', { isSelected: false }),
          snapshotRow('source-salt', { isSelected: false }),
        ],
      }),
      ignored: false,
      createId: createIdSequence(),
    });

    expect(plan.snapshotRowIdsToSelect).toEqual([
      'snapshot-source-rice',
      'snapshot-source-salt',
    ]);
    expect(createdSnapshotIds(plan)).toEqual([
      'snapshot-source-rice',
      'snapshot-source-salt',
    ]);
  });

  it('keeps purchased links and only re-creates removed unchecked items', () => {
    const plan = planMealPlanEntryIgnored({
      entry: recipeEntry({
        ignoredByGroceryList: true,
        snapshotRows: [
          snapshotRow('source-rice', {
            isSelected: true,
            grocery_item: linkedItem('grocery-rice', { isChecked: true }),
          }),
          snapshotRow('source-salt', {
            isSelected: true,
            grocery_item: linkedItem('grocery-salt', { isDeleted: true }),
          }),
        ],
      }),
      ignored: false,
      createId: createIdSequence(),
    });

    expect(plan.listSync.unlinks).toEqual([
      {
        source: { type: 'snapshot', snapshotId: 'snapshot-source-salt' },
        groceryItemId: 'grocery-salt',
      },
    ]);
    expect(createdSnapshotIds(plan)).toEqual(['snapshot-source-salt']);
    expect(plan.softRestores).toEqual([]);
  });

  it('backfills missing snapshot rows, selected, and lists them', () => {
    const plan = planMealPlanEntryIgnored({
      entry: recipeEntry({
        ignoredByGroceryList: true,
        snapshotRows: [],
      }),
      ignored: false,
      createId: createIdSequence(),
    });

    expect(plan.snapshotRowsToCreate).toEqual([
      expect.objectContaining({
        id: 'new-snapshot-1',
        sourceRecipeIngredientId: 'source-rice',
        isSelected: true,
      }),
      expect.objectContaining({
        id: 'new-snapshot-2',
        sourceRecipeIngredientId: 'source-salt',
        isSelected: true,
      }),
    ]);
    expect(createdSnapshotIds(plan)).toEqual([
      'new-snapshot-1',
      'new-snapshot-2',
    ]);
  });

  it('applies the list default store to re-created items', () => {
    const plan = planMealPlanEntryIgnored({
      entry: itemEntry({ ignoredByGroceryList: true }),
      ignored: false,
      defaultStore: { id: 'store-default', name: 'Default' },
      createId: createIdSequence(),
    });

    expect(plan.listSync.creates).toEqual([
      expect.objectContaining({
        fields: expect.objectContaining({ storeId: 'store-default' }),
      }),
    ]);
  });
});

describe('planMealPlanEntryIgnored — recipes and items share a contract', () => {
  it('hiding an item removes its pending linked item', () => {
    const plan = planMealPlanEntryIgnored({
      entry: itemEntry({ grocery_item: linkedItem('grocery-bananas') }),
      ignored: true,
      createId: createIdSequence(),
    });

    expect(plan.listSync.deletes).toEqual([
      {
        source: { type: 'item', mealPlanItemId: 'meal-plan-item-1' },
        groceryItemId: 'grocery-bananas',
      },
    ]);
    expect(plan.softDeletes).toEqual([]);
  });

  it('hiding an item soft-deletes its checked linked item', () => {
    const plan = planMealPlanEntryIgnored({
      entry: itemEntry({
        grocery_item: linkedItem('grocery-bananas', { isChecked: true }),
      }),
      ignored: true,
      createId: createIdSequence(),
    });

    expect(plan.listSync).toEqual({
      creates: [],
      updates: [],
      deletes: [],
      unlinks: [],
    });
    expect(plan.softDeletes).toEqual([{ groceryItemId: 'grocery-bananas' }]);
  });

  it('showing an item puts it back on the list', () => {
    const plan = planMealPlanEntryIgnored({
      entry: itemEntry({ ignoredByGroceryList: true }),
      ignored: false,
      createId: createIdSequence(),
    });

    expect(plan.snapshotRowIdsToSelect).toEqual([]);
    expect(plan.snapshotRowsToCreate).toEqual([]);
    expect(plan.listSync.creates).toEqual([
      {
        source: { type: 'item', mealPlanItemId: 'meal-plan-item-1' },
        fields: {
          name: 'Bananas',
          quantity: 6,
          unit: 'each',
          category: 'Produce',
          notes: null,
          storeId: null,
        },
      },
    ]);
    expect(plan.softDeletes).toEqual([]);
  });

  it('showing an item with checked history preserves its purchase', () => {
    const plan = planMealPlanEntryIgnored({
      entry: itemEntry({
        ignoredByGroceryList: true,
        grocery_item: linkedItem('grocery-bananas', { isChecked: true }),
      }),
      ignored: false,
      createId: createIdSequence(),
    });

    expect(plan.listSync.unlinks).toEqual([]);
    expect(plan.listSync.creates).toEqual([]);
    expect(plan.softDeletes).toEqual([]);
    expect(plan.softRestores).toEqual([]);
  });

  it('showing restores hidden purchases without replacing checked items', () => {
    const plan = planMealPlanEntryIgnored({
      entry: recipeEntry({
        ignoredByGroceryList: true,
        snapshotRows: [
          snapshotRow('source-rice', {
            isSelected: true,
            grocery_item: linkedItem('grocery-rice', { isChecked: true }),
          }),
          snapshotRow('source-salt', {
            isSelected: true,
            grocery_item: linkedItem('grocery-salt', {
              isChecked: true,
              isDeleted: true,
            }),
          }),
        ],
      }),
      ignored: false,
      createId: createIdSequence(),
    });

    expect(plan.listSync.unlinks).toEqual([]);
    expect(plan.listSync.creates).toEqual([]);
    expect(plan.softDeletes).toEqual([]);
    expect(plan.softRestores).toEqual([{ groceryItemId: 'grocery-salt' }]);
  });

  it('showing with soft-deleted history unlinks but does not soft-delete again', () => {
    const plan = planMealPlanEntryIgnored({
      entry: itemEntry({
        ignoredByGroceryList: true,
        grocery_item: linkedItem('grocery-bananas', {
          isChecked: false,
          isDeleted: true,
        }),
      }),
      ignored: false,
      createId: createIdSequence(),
    });

    expect(plan.listSync.unlinks).toEqual([
      {
        source: { type: 'item', mealPlanItemId: 'meal-plan-item-1' },
        groceryItemId: 'grocery-bananas',
      },
    ]);
    expect(plan.listSync.creates).toHaveLength(1);
    // Already soft-deleted, so no additional soft-delete
    expect(plan.softDeletes).toEqual([]);
  });
});

describe('planMealPlanEntryIgnored — shopping state transitions', () => {
  it.each([false, true])(
    'keeps show enabled after hide/show with allPurchased=%s',
    allPurchased => {
      const entry = recipeEntry({
        snapshotRows: [
          snapshotRow('source-rice', {
            grocery_item: linkedItem('purchased-rice', { isChecked: true }),
          }),
          snapshotRow('source-salt', {
            grocery_item: linkedItem('grocery-salt', {
              isChecked: allPurchased,
            }),
          }),
        ],
      });
      const hide = planMealPlanEntryIgnored({
        entry,
        ignored: true,
        createId: createIdSequence(),
      });
      const hidden = {
        ...entry,
        ignoredByGroceryList: true,
        snapshotRows: entry.snapshotRows.map(row => ({
          ...row,
          grocery_item: row.grocery_item?.isChecked
            ? { ...row.grocery_item, isDeleted: true }
            : null,
        })),
      };
      expect(hide.softDeletes).toHaveLength(allPurchased ? 2 : 1);
      const show = planMealPlanEntryIgnored({
        entry: hidden,
        ignored: false,
        createId: createIdSequence(),
      });
      expect(show.listSync.unlinks).toEqual([]);
      expect(createdSnapshotIds(show)).toEqual(
        allPurchased ? [] : ['snapshot-source-salt']
      );
      const restored = {
        ...hidden,
        ignoredByGroceryList: false,
        snapshotRows: hidden.snapshotRows.map(row => ({
          ...row,
          grocery_item: row.grocery_item
            ? { ...row.grocery_item, isDeleted: false }
            : linkedItem('restored-salt', {
                name: 'Salt',
                quantity: 2,
                unit: 'tsp',
              }),
        })),
      };
      expect(show.softRestores.map(item => item.groceryItemId)).toEqual(
        allPurchased ? ['purchased-rice', 'grocery-salt'] : ['purchased-rice']
      );
      expect(
        getMealPlanShoppingState({
          recipe: { recipe_ingredients: sourceIngredients },
          ingredient_snapshots: restored.snapshotRows,
        })
      ).toMatchObject({
        isShownOnGroceryList: true,
        purchasedCount: allPurchased ? 2 : 1,
        pendingCount: allPurchased ? 0 : 1,
      });
      expect(planMealPlanListSync({ entry: restored })).toEqual({
        creates: [],
        updates: [],
        deletes: [],
        unlinks: [],
      });
    }
  );
  it('explicitly restores cleared selected purchases even when the ignored flag is false', () => {
    const plan = planMealPlanEntryIgnored({
      entry: recipeEntry({
        ignoredByGroceryList: false,
        snapshotRows: [
          snapshotRow('source-rice', {
            grocery_item: linkedItem('cleared-rice', {
              isChecked: true,
              isDeleted: true,
            }),
          }),
          snapshotRow('source-salt', {
            isSelected: false,
            grocery_item: linkedItem('cleared-salt', {
              isChecked: true,
              isDeleted: true,
            }),
          }),
        ],
      }),
      ignored: false,
      createId: createIdSequence(),
    });
    expect(createdSnapshotIds(plan)).toEqual([]);
    expect(plan.listSync.unlinks).toEqual([]);
    expect(plan.softRestores).toEqual([{ groceryItemId: 'cleared-rice' }]);
    expect(plan.softDeletes).toEqual([]);
  });

  it('repeated show against newly pending rows produces no writes', () => {
    const plan = planMealPlanEntryIgnored({
      entry: recipeEntry({
        snapshotRows: [
          snapshotRow('source-rice', {
            grocery_item: linkedItem('pending-rice'),
          }),
          snapshotRow('source-salt', { isSelected: false }),
        ],
      }),
      ignored: false,
      createId: createIdSequence(),
    });
    expect(plan.listSync).toEqual({
      creates: [],
      updates: [],
      deletes: [],
      unlinks: [],
    });
    expect(plan.softDeletes).toEqual([]);
  });

  it('hiding removes pending items and soft-deletes checked ones', () => {
    const plan = planMealPlanEntryIgnored({
      entry: recipeEntry({
        snapshotRows: [
          snapshotRow('source-rice', {
            isSelected: true,
            grocery_item: linkedItem('grocery-rice'),
          }),
          snapshotRow('source-salt', {
            isSelected: true,
            grocery_item: linkedItem('grocery-salt', { isChecked: true }),
          }),
        ],
      }),
      ignored: true,
      createId: createIdSequence(),
    });

    expect(plan.listSync.deletes).toEqual([
      {
        source: { type: 'snapshot', snapshotId: 'snapshot-source-rice' },
        groceryItemId: 'grocery-rice',
      },
    ]);
    expect(plan.softDeletes).toEqual([{ groceryItemId: 'grocery-salt' }]);
  });

  it('showing after hiding restores selection and recreates items', () => {
    const plan = planMealPlanEntryIgnored({
      entry: recipeEntry({
        ignoredByGroceryList: true,
        snapshotRows: [
          snapshotRow('source-rice', { isSelected: true }),
          snapshotRow('source-salt', { isSelected: false }),
        ],
      }),
      ignored: false,
      createId: createIdSequence(),
    });

    expect(createdSnapshotIds(plan)).toEqual(['snapshot-source-rice']);
    expect(plan.listSync.deletes).toEqual([]);
    expect(plan.softDeletes).toEqual([]);
  });
});

describe('planMealPlanEntryIgnored — bulk eligibility guards', () => {
  it('only soft-deletes checked non-deleted items when hiding', () => {
    const plan = planMealPlanEntryIgnored({
      entry: recipeEntry({
        snapshotRows: [
          snapshotRow('source-rice', {
            grocery_item: linkedItem('grocery-rice', {
              isChecked: true,
              isDeleted: false,
            }),
          }),
          snapshotRow('source-salt', {
            grocery_item: linkedItem('grocery-salt', {
              isChecked: true,
              isDeleted: true,
            }),
          }),
        ],
      }),
      ignored: true,
      createId: createIdSequence(),
    });

    expect(plan.softDeletes).toEqual([{ groceryItemId: 'grocery-rice' }]);
  });
});

describe('isMealPlanOnly', () => {
  it('is true only for ignored entries', () => {
    expect(isMealPlanOnly({ ignoredByGroceryList: true })).toBe(true);
    expect(isMealPlanOnly({ ignoredByGroceryList: false })).toBe(false);
    expect(isMealPlanOnly({ ignoredByGroceryList: null })).toBe(false);
    expect(isMealPlanOnly({})).toBe(false);
  });
});
