import { describe, expect, it } from 'vitest';

import {
  clearBulkSelection,
  createBulkSelectionState,
  enterBulkSelectionMode,
  exitBulkSelectionMode,
  selectAllVisibleUncheckedItems,
  toggleBulkSelectionItem,
} from '../controller';

const sampleItems = [
  { id: 'item-a', isChecked: false },
  { id: 'item-b', isChecked: true },
  { id: 'item-c', isChecked: false },
];

describe('bulk selection mode flow', () => {
  it('supports enter, row toggle, checkbox toggle, and exit', () => {
    const entered = enterBulkSelectionMode(createBulkSelectionState());
    expect(entered.isActive).toBe(true);

    const afterRowToggle = toggleBulkSelectionItem(entered, sampleItems[0]);
    expect([...afterRowToggle.selectedItemIds]).toEqual(['item-a']);

    const afterCheckboxToggle = toggleBulkSelectionItem(
      afterRowToggle,
      sampleItems[0]
    );
    expect([...afterCheckboxToggle.selectedItemIds]).toEqual([]);

    const exited = exitBulkSelectionMode(afterCheckboxToggle);
    expect(exited.isActive).toBe(false);
    expect([...exited.selectedItemIds]).toEqual([]);
  });

  it('uses only unchecked rows for bulk visibility and select all', () => {
    const visibleRows = sampleItems.filter(item => !item.isChecked);
    expect(visibleRows.map(item => item.id)).toEqual(['item-a', 'item-c']);

    const state = enterBulkSelectionMode(createBulkSelectionState());
    const selected = selectAllVisibleUncheckedItems(state, sampleItems);
    expect([...selected.selectedItemIds]).toEqual(['item-a', 'item-c']);
  });

  it('clears all and keeps bulk mode active until closed', () => {
    const state = selectAllVisibleUncheckedItems(
      enterBulkSelectionMode(createBulkSelectionState()),
      sampleItems
    );

    const cleared = clearBulkSelection(state);
    expect(cleared.isActive).toBe(true);
    expect([...cleared.selectedItemIds]).toEqual([]);
  });
});
