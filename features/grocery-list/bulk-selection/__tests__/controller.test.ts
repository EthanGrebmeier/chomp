import { describe, expect, it } from 'vitest';

import {
  clearBulkSelection,
  createBulkSelectionState,
  enterBulkSelectionMode,
  exitBulkSelectionMode,
  selectAllVisibleUncheckedItems,
  toggleBulkSelectionItem,
} from '../controller';

describe('bulk selection controller', () => {
  it('enters mode with an empty selection', () => {
    const initialState = createBulkSelectionState();
    const activeState = enterBulkSelectionMode(initialState);

    expect(activeState.isActive).toBe(true);
    expect([...activeState.selectedItemIds]).toEqual([]);
  });

  it('prevents selecting checked items', () => {
    const state = enterBulkSelectionMode(createBulkSelectionState());

    const nextState = toggleBulkSelectionItem(state, {
      id: 'item-checked',
      isChecked: true,
    });

    expect(nextState).toBe(state);
    expect([...nextState.selectedItemIds]).toEqual([]);
  });

  it('toggles unchecked item selection on and off', () => {
    const state = enterBulkSelectionMode(createBulkSelectionState());

    const selectedState = toggleBulkSelectionItem(state, {
      id: 'item-a',
      isChecked: false,
    });
    expect([...selectedState.selectedItemIds]).toEqual(['item-a']);

    const unselectedState = toggleBulkSelectionItem(selectedState, {
      id: 'item-a',
      isChecked: false,
    });
    expect([...unselectedState.selectedItemIds]).toEqual([]);
  });

  it('selects all visible unchecked items only', () => {
    const state = enterBulkSelectionMode(createBulkSelectionState());

    const nextState = selectAllVisibleUncheckedItems(state, [
      { id: 'item-a', isChecked: false },
      { id: 'item-b', isChecked: true },
      { id: 'item-c', isChecked: false },
    ]);

    expect([...nextState.selectedItemIds]).toEqual(['item-a', 'item-c']);
  });

  it('clears all selected items while mode remains active', () => {
    const state = selectAllVisibleUncheckedItems(
      enterBulkSelectionMode(createBulkSelectionState()),
      [
        { id: 'item-a', isChecked: false },
        { id: 'item-c', isChecked: false },
      ]
    );

    const clearedState = clearBulkSelection(state);
    expect(clearedState.isActive).toBe(true);
    expect([...clearedState.selectedItemIds]).toEqual([]);
  });

  it('always clears selected items when exiting mode', () => {
    const state = selectAllVisibleUncheckedItems(
      enterBulkSelectionMode(createBulkSelectionState()),
      [
        { id: 'item-a', isChecked: false },
        { id: 'item-c', isChecked: false },
      ]
    );

    const exitedState = exitBulkSelectionMode(state);
    expect(exitedState.isActive).toBe(false);
    expect([...exitedState.selectedItemIds]).toEqual([]);
  });
});
