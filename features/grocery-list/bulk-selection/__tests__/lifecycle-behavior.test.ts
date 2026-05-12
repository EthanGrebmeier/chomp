import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createBulkSelectionState,
  enterBulkSelectionMode,
  exitBulkSelectionMode,
  selectAllVisibleUncheckedItems,
} from '../controller';
import { runBulkDelete } from '../delete-orchestrator';
import { runBulkMove } from '../move-orchestrator';
import { runBulkCategoryUpdate, runBulkStoreUpdate } from '../store-category-orchestrator';
import { getBulkToolbarActions } from '../toolbar';

const {
  updateGroceryItemOnlyMock,
  syncSavedItemFromGroceryItemMock,
} = vi.hoisted(() => ({
  updateGroceryItemOnlyMock: vi.fn(),
  syncSavedItemFromGroceryItemMock: vi.fn(),
}));

vi.mock('../../instant/update-grocery-item-only', () => ({
  updateGroceryItemOnly: updateGroceryItemOnlyMock,
}));

vi.mock('../../instant/sync-saved-item-from-grocery-item', () => ({
  syncSavedItemFromGroceryItem: syncSavedItemFromGroceryItemMock,
}));

const buildActiveSelectionState = () =>
  selectAllVisibleUncheckedItems(enterBulkSelectionMode(createBulkSelectionState()), [
    { id: 'item-1', isChecked: false },
    { id: 'item-2', isChecked: false },
  ]);

beforeEach(() => {
  updateGroceryItemOnlyMock.mockReset();
  syncSavedItemFromGroceryItemMock.mockReset();
});

describe('bulk mode lifecycle behavior', () => {
  it('covers mode entry/exit, unchecked visibility scope, and zero-selection disabled actions', () => {
    const entered = enterBulkSelectionMode(createBulkSelectionState());
    expect(entered.isActive).toBe(true);

    const visibleRows = [
      { id: 'item-1', isChecked: false },
      { id: 'item-2', isChecked: true },
      { id: 'item-3', isChecked: false },
    ].filter(item => !item.isChecked);
    expect(visibleRows.map(item => item.id)).toEqual(['item-1', 'item-3']);

    const disabledActions = getBulkToolbarActions(0);
    expect(disabledActions.every(action => action.isDisabled)).toBe(true);

    const exited = exitBulkSelectionMode(entered);
    expect(exited.isActive).toBe(false);
    expect(exited.selectedItemIds.size).toBe(0);
  });

  it('resets mode state after successful bulk delete', async () => {
    let state = buildActiveSelectionState();

    const result = await runBulkDelete({
      selectedItemIds: state.selectedItemIds,
      confirmDelete: vi.fn().mockResolvedValue(true),
      deleteItems: vi.fn().mockResolvedValue(undefined),
      onDeleteSuccess: () => {
        state = exitBulkSelectionMode(state);
      },
    });

    expect(result).toBe('deleted');
    expect(state.isActive).toBe(false);
    expect(state.selectedItemIds.size).toBe(0);
  });

  it('resets mode state after successful bulk store update', async () => {
    updateGroceryItemOnlyMock.mockResolvedValue(undefined);
    syncSavedItemFromGroceryItemMock.mockResolvedValue(undefined);
    let state = buildActiveSelectionState();

    const result = await runBulkStoreUpdate({
      selectedItemIds: [...state.selectedItemIds],
      selectedItems: [
        {
          id: 'item-1',
          name: 'Milk',
          store: { id: 'store-old' },
          saved_item: null,
        },
        {
          id: 'item-2',
          name: 'Eggs',
          store: { id: 'store-old' },
          saved_item: null,
        },
      ],
      storeId: 'store-next',
    });
    state = exitBulkSelectionMode(state);

    expect(result.updatedItemCount).toBe(2);
    expect(state.isActive).toBe(false);
    expect(state.selectedItemIds.size).toBe(0);
  });

  it('resets mode state after successful bulk category update', async () => {
    updateGroceryItemOnlyMock.mockResolvedValue(undefined);
    syncSavedItemFromGroceryItemMock.mockResolvedValue(undefined);
    let state = buildActiveSelectionState();

    const result = await runBulkCategoryUpdate({
      selectedItemIds: [...state.selectedItemIds],
      selectedItems: [
        {
          id: 'item-1',
          name: 'Milk',
          saved_item: null,
        },
        {
          id: 'item-2',
          name: 'Eggs',
          saved_item: null,
        },
      ],
      category: 'dairy',
    });
    state = exitBulkSelectionMode(state);

    expect(result.updatedItemCount).toBe(2);
    expect(state.isActive).toBe(false);
    expect(state.selectedItemIds.size).toBe(0);
  });

  it('resets mode state after successful bulk move', async () => {
    let state = buildActiveSelectionState();

    const result = await runBulkMove({
      moveSelectionPayload: {
        selectedItemIds: [...state.selectedItemIds],
        sourceListId: 'list-a',
        destinationListId: 'list-b',
      },
      selectedItems: [
        {
          id: 'item-1',
          name: 'Milk',
          quantity: 1,
          unit: 'carton',
          category: 'dairy',
          isChecked: false,
          store: null,
        },
        {
          id: 'item-2',
          name: 'Eggs',
          quantity: 12,
          unit: 'each',
          category: 'dairy',
          isChecked: false,
          store: null,
        },
      ],
      fetchDestinationItems: vi.fn().mockResolvedValue([]),
      applyDestinationPlan: vi.fn().mockResolvedValue(undefined),
      removeSourceItems: vi.fn().mockResolvedValue(undefined),
      onMoveSuccess: () => {
        state = exitBulkSelectionMode(state);
      },
    });

    expect(result).toBe('moved');
    expect(state.isActive).toBe(false);
    expect(state.selectedItemIds.size).toBe(0);
  });
});
