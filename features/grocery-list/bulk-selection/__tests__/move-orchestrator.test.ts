import { describe, expect, it } from 'vitest';

import {
  buildBulkMovePlan,
  buildBulkMoveSelectionPayload,
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
          store: { id: 'store-1', name: 'Trader Joe\'s' },
          notes: 'ripe',
          isChecked: false,
        },
        {
          id: 'source-2',
          name: 'Bananas',
          quantity: 1,
          unit: 'each',
          category: 'produce',
          store: { id: 'store-1', name: 'Trader Joe\'s' },
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
          store: { id: 'store-1', name: 'Trader Joe\'s' },
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
