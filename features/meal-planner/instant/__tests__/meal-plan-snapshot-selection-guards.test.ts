import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MealPlanRecipeSyncRow } from '../meal-plan-entry-sync-context';

const { query, transact, buildSync } = vi.hoisted(() => ({
  query: vi.fn(),
  transact: vi.fn(),
  buildSync: vi.fn(() => []),
}));
vi.mock('../../../../lib/instant', () => ({ db: { transact } }));
vi.mock('@instantdb/react-native', () => ({
  id: () => 'new-id',
  tx: {
    meal_plan_recipe_ingredient_snapshots: new Proxy(
      {},
      {
        get: (_, id) => ({ update: (fields: unknown) => ({ id, fields }) }),
      }
    ),
  },
}));
vi.mock('../query-meal-plan-entry-sync-rows', () => ({
  queryMealPlanRecipeSyncRow: query,
}));
vi.mock('../build-meal-plan-list-sync-transactions', () => ({
  buildMealPlanEntrySyncTransactions: buildSync,
}));
import { MealPlanIngredientSnapshotStore } from '../meal-plan-ingredient-snapshot-store';

const item = (isChecked = false, isDeleted = false) => ({
  id: 'grocery',
  name: 'Rice',
  quantity: 1,
  unit: 'cup',
  isChecked,
  isDeleted,
});
const snapshot = (
  id: string,
  grocery_item: ReturnType<typeof item> | null = null,
  source = id
) => ({
  id,
  sourceRecipeIngredientId: source,
  name: 'Rice',
  quantity: 1,
  unit: 'cup',
  isSelected: true,
  isQuantityOverridden: false,
  grocery_item,
});
const row = (
  snapshots = [snapshot('rice', item()), snapshot('salt')]
): MealPlanRecipeSyncRow => ({
  id: 'meal',
  servings: 1,
  ignoredByGroceryList: false,
  grocery_list: { id: 'list' },
  recipe: {
    id: 'recipe',
    recipe_ingredients: ['rice', 'salt'].map(id => ({
      id,
      name: id,
      quantity: 1,
      unit: 'cup',
    })),
  },
  ingredient_snapshots: snapshots,
});
const select = (snapshotRowId: string, isSelected = false) =>
  MealPlanIngredientSnapshotStore.updateRowSelection({
    snapshotRowId,
    isSelected,
    defaultStore: null,
  });

beforeEach(() => {
  vi.clearAllMocks();
  transact.mockResolvedValue(undefined);
});

describe('fresh snapshot selection guards', () => {
  it('writes a pending row selection using the fresh context', async () => {
    query.mockResolvedValue(row());
    await select('rice');
    expect(query).toHaveBeenCalledWith({ snapshotRowId: 'rice' });
    expect(transact).toHaveBeenCalledWith([
      { id: 'rice', fields: { isSelected: false } },
    ]);
    expect(buildSync).toHaveBeenCalledOnce();
  });

  it('allows selecting an absent row only while another row is visible', async () => {
    query.mockResolvedValue(row());
    await select('salt', true);
    expect(transact).toHaveBeenCalledWith([
      { id: 'salt', fields: { isSelected: true } },
    ]);
  });

  it.each([
    [true, false],
    [true, true],
    [false, true],
  ])('guards checked=%s deleted=%s history', async (checked, deleted) => {
    query.mockResolvedValue(
      row([snapshot('rice', item(checked, deleted)), snapshot('salt', item())])
    );
    await select('rice');
    expect(transact).not.toHaveBeenCalled();
    expect(buildSync).not.toHaveBeenCalled();
  });

  it('blocks selection when ignored even if a leftover item is visible', async () => {
    query.mockResolvedValue({ ...row(), ignoredByGroceryList: true });
    await select('salt', true);
    expect(transact).not.toHaveBeenCalled();
  });

  it.each([true, false])(
    'blocks selection=%s when no canonical row is visible',
    async selected => {
      query.mockResolvedValue(
        row([snapshot('rice', item(true, true)), snapshot('salt')])
      );
      await select('salt', selected);
      expect(transact).not.toHaveBeenCalled();
    }
  );

  it('ignores orphan, duplicate and missing snapshot IDs', async () => {
    query.mockResolvedValue(
      row([
        snapshot('rice', item()),
        snapshot('duplicate', item(), 'rice'),
        snapshot('orphan', item()),
      ])
    );
    for (const id of ['duplicate', 'orphan', 'missing']) await select(id);
    expect(transact).not.toHaveBeenCalled();
  });

  it('bulk edits filter purchased and removed rows instead of changing history', async () => {
    const current = row([
      snapshot('rice', item(true, true)),
      snapshot('salt', item()),
    ]);
    query.mockResolvedValue(current);
    await MealPlanIngredientSnapshotStore.updateRowsSelection({
      mealPlanRecipeId: 'meal',
      selections: [
        { snapshotRowId: 'rice', isSelected: false },
        { snapshotRowId: 'salt', isSelected: false },
      ],
      defaultStore: null,
    });
    expect(transact).toHaveBeenCalledWith([
      { id: 'salt', fields: { isSelected: false } },
    ]);
  });
});
