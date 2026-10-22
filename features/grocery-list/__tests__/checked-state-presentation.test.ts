import { describe, expect, it } from 'vitest';

import {
  createCheckedStateSnapshot,
  getPresentedCheckedState,
  hasCheckedStateTransition,
  reconcilePresentedCheckedState,
} from '../checked-state-presentation';

describe('checked-state presentation', () => {
  it('detects checked-state changes without treating additions as transitions', () => {
    const previous = createCheckedStateSnapshot([
      { id: 'existing', isChecked: false },
    ]);

    expect(
      hasCheckedStateTransition(
        previous,
        createCheckedStateSnapshot([
          { id: 'existing', isChecked: false },
          { id: 'new', isChecked: true },
        ])
      )
    ).toBe(false);

    expect(
      hasCheckedStateTransition(
        previous,
        createCheckedStateSnapshot([{ id: 'existing', isChecked: true }])
      )
    ).toBe(true);
  });

  it('keeps existing items in their presented section while reconciling membership', () => {
    const presented = createCheckedStateSnapshot([
      { id: 'removed', isChecked: false },
      { id: 'transitioning', isChecked: false },
    ]);
    const current = createCheckedStateSnapshot([
      { id: 'transitioning', isChecked: true },
      { id: 'new', isChecked: true },
    ]);

    const reconciled = reconcilePresentedCheckedState(presented, current);

    expect(Array.from(reconciled.entries())).toEqual([
      ['transitioning', false],
      ['new', true],
    ]);
  });

  it('uses the presented section independently from the current visual state', () => {
    const item = { id: 'item-1', isChecked: true };
    const presented = createCheckedStateSnapshot([
      { id: 'item-1', isChecked: false },
    ]);

    expect(getPresentedCheckedState(item, presented)).toBe(false);
    expect(item.isChecked).toBe(true);
  });
});
