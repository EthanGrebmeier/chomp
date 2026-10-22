import { describe, expect, it } from 'vitest';

import {
  buildBulkMovePlan,
  buildBulkMoveSelectionPayload,
  planBulkMoveSourceRemoval,
  runBulkMove,
} from '../move-orchestrator';

describe('bulk move destination selection payload', () => {
  it('returns null when no items are selected', () => {
    const payload = buildBulkMoveSelectionPayload({
      selectedItemIds: new Set<string>(),
      sourceListId: 'list-1',
      destinationListId: 'list-2',
    });

    expect(payload).toBeNull();
  });

  it('returns null when destination matches the current list', () => {
    const payload = buildBulkMoveSelectionPayload({
      selectedItemIds: new Set(['item-1']),
      sourceListId: 'list-1',
      destinationListId: 'list-1',
    });

    expect(payload).toBeNull();
  });

  it('builds payload when destination is valid', () => {
    const payload = buildBulkMoveSelectionPayload({
      selectedItemIds: new Set(['item-1', 'item-2']),
      sourceListId: 'list-1',
      destinationListId: 'list-2',
    });

    expect(payload).toEqual({
      selectedItemIds: ['item-1', 'item-2'],
      sourceListId: 'list-1',
      destinationListId: 'list-2',
    });
  });
});

describe('bulk move planning', () => {
  it('plans merge quantity updates and source removals when destination matches', () => {
    const plan = buildBulkMovePlan({
      selectedItemIds: ['source-1', 'source-2'],
      selectedItems: [
        {
          id: 'source-1',
          name: 'Bananas',
          quantity: 2,
          unit: 'each',
          category: 'produce',
          store: { id: 'store-1', name: "Trader Joe's" },
          notes: 'ripe',
          isChecked: false,
        },
        {
          id: 'source-2',
          name: 'Bananas',
          quantity: 1,
          unit: 'each',
          category: 'produce',
          store: { id: 'store-1', name: "Trader Joe's" },
          notes: 'yellow',
          isChecked: false,
        },
      ],
      destinationItems: [
        {
          id: 'dest-1',
          name: 'Bananas',
          quantity: 4,
          unit: 'each',
          category: 'produce',
          store: { id: 'store-1', name: "Trader Joe's" },
          updatedAt: '2026-05-12T01:00:00.000Z',
        },
      ],
    });

    expect(plan.quantityUpdates.get('dest-1')).toBe(3);
    expect(plan.createEntries).toEqual([]);
    expect(plan.sourceItemIdsToRemove).toEqual(['source-1', 'source-2']);
    expect(plan.skippedItemCount).toBe(0);
  });

  it('plans create entries when destination has no conflict and skips missing selections', () => {
    const plan = buildBulkMovePlan({
      selectedItemIds: ['missing-id', 'source-2'],
      selectedItems: [
        {
          id: 'source-2',
          name: 'Milk',
          quantity: 1,
          unit: 'carton',
          category: 'dairy',
          notes: '2%',
          store: { id: 'store-2', name: 'Costco' },
          isChecked: false,
        },
      ],
      destinationItems: [],
    });

    expect(plan.quantityUpdates.size).toBe(0);
    expect(plan.createEntries).toEqual([
      {
        name: 'Milk',
        quantity: 1,
        unit: 'carton',
        category: 'dairy',
        notes: '2%',
        isChecked: false,
        storeId: 'store-2',
      },
    ]);
    expect(plan.sourceItemIdsToRemove).toEqual(['source-2']);
    expect(plan.skippedItemCount).toBe(1);
  });
});

describe('bulk move execution', () => {
  it('applies destination changes before removing source items', async () => {
    const callOrder: string[] = [];
    const onMoveSuccess = () => callOrder.push('success');
    const payload = {
      selectedItemIds: ['source-1'],
      sourceListId: 'list-a',
      destinationListId: 'list-b',
    };

    const result = await runBulkMove({
      moveSelectionPayload: payload,
      selectedItems: [
        {
          id: 'source-1',
          name: 'Oats',
          quantity: 2,
          unit: 'box',
          category: 'pantry',
          notes: null,
          isChecked: false,
          store: null,
        },
      ],
      fetchDestinationItems: async () => {
        callOrder.push('fetch');
        return [];
      },
      applyDestinationPlan: async () => {
        callOrder.push('apply');
      },
      removeSourceItems: async () => {
        callOrder.push('remove');
      },
      onMoveSuccess,
    });

    expect(result).toBe('moved');
    expect(callOrder).toEqual(['fetch', 'apply', 'remove', 'success']);
  });
});

describe('bulk move of meal plan linked items', () => {
  const linkedRecipeItem = (
    id: string,
    snapshotId: string,
    snapshots: { id: string; isSelected: boolean }[]
  ) => ({
    id,
    name: 'Onion',
    quantity: 1,
    unit: 'each',
    category: 'produce',
    isChecked: false,
    isDeleted: false,
    meal_plan_ingredient_snapshot: {
      id: snapshotId,
      meal_plan_recipe: {
        id: 'meal-1',
        ignoredByGroceryList: false,
        ingredient_snapshots: snapshots,
      },
    },
  });

  it('creates an ordinary destination item with no meal plan link', () => {
    const plan = buildBulkMovePlan({
      selectedItemIds: ['linked-1'],
      selectedItems: [
        linkedRecipeItem('linked-1', 'snap-1', [
          { id: 'snap-1', isSelected: true },
        ]),
      ],
      destinationItems: [],
    });

    expect(plan.createEntries).toEqual([
      {
        name: 'Onion',
        quantity: 1,
        unit: 'each',
        category: 'produce',
        notes: undefined,
        isChecked: false,
        storeId: undefined,
      },
    ]);
    expect(plan.sourceItemIdsToRemove).toEqual(['linked-1']);
  });

  it('removes the linked source item and deselects its ingredient', () => {
    const plan = planBulkMoveSourceRemoval([
      linkedRecipeItem('linked-1', 'snap-1', [
        { id: 'snap-1', isSelected: true },
        { id: 'snap-2', isSelected: true },
      ]),
    ]);

    expect(plan).toEqual({
      groceryItemIdsToSoftDelete: [],
      groceryItemIdsToRemove: ['linked-1'],
      snapshotRowIdsToDeselect: ['snap-1'],
      entriesToIgnore: [],
    });
  });

  it('ignores the meal when its last selected ingredient is moved', () => {
    const plan = planBulkMoveSourceRemoval([
      linkedRecipeItem('linked-1', 'snap-1', [
        { id: 'snap-1', isSelected: true },
        { id: 'snap-2', isSelected: false },
      ]),
    ]);

    expect(plan.groceryItemIdsToRemove).toEqual(['linked-1']);
    expect(plan.snapshotRowIdsToDeselect).toEqual([]);
    expect(plan.entriesToIgnore).toEqual([{ type: 'recipe', id: 'meal-1' }]);
  });

  it('ignores a standalone planned item that is moved', () => {
    const plan = planBulkMoveSourceRemoval([
      {
        id: 'linked-item',
        isChecked: false,
        meal_plan_item: { id: 'plan-item-1', ignoredByGroceryList: false },
      },
    ]);

    expect(plan.groceryItemIdsToRemove).toEqual(['linked-item']);
    expect(plan.entriesToIgnore).toEqual([{ type: 'item', id: 'plan-item-1' }]);
  });

  it('unlinks and deselects a moved linked item even when it is checked', () => {
    const plan = planBulkMoveSourceRemoval([
      {
        ...linkedRecipeItem('linked-1', 'snap-1', [
          { id: 'snap-1', isSelected: true },
          { id: 'snap-2', isSelected: true },
        ]),
        isChecked: true,
      },
    ]);

    expect(plan.groceryItemIdsToRemove).toEqual(['linked-1']);
    expect(plan.groceryItemIdsToSoftDelete).toEqual([]);
    expect(plan.snapshotRowIdsToDeselect).toEqual(['snap-1']);
  });

  it('soft deletes unlinked moved items without touching the meal plan', () => {
    const plan = planBulkMoveSourceRemoval([
      { id: 'plain-1', isChecked: false },
    ]);

    expect(plan).toEqual({
      groceryItemIdsToSoftDelete: ['plain-1'],
      groceryItemIdsToRemove: [],
      snapshotRowIdsToDeselect: [],
      entriesToIgnore: [],
    });
  });
});
