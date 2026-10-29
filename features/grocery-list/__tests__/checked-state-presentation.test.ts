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

it('keeps an unchecked item unchecked while its section catches up in both directions', () => {
  const unchecked = [{ id: 'milk', isChecked: false }];
  const checked = [{ id: 'milk', isChecked: true }];
  let presented = createCheckedStateSnapshot(unchecked);

  // During check feedback the row stays in its original section.
  presented = reconcilePresentedCheckedState(
    presented,
    createCheckedStateSnapshot(checked)
  );
  expect(getPresentedCheckedState(checked[0], presented)).toBe(false);
  expect(checked[0].isChecked).toBe(true);

  // After it moves to Checked, unchecking must immediately supply false to
  // the row, even though section placement is deliberately delayed.
  presented = createCheckedStateSnapshot(checked);
  presented = reconcilePresentedCheckedState(
    presented,
    createCheckedStateSnapshot(unchecked)
  );
  expect(getPresentedCheckedState(unchecked[0], presented)).toBe(true);
  expect(unchecked[0].isChecked).toBe(false);

  presented = createCheckedStateSnapshot(unchecked);
  expect(getPresentedCheckedState(unchecked[0], presented)).toBe(false);
});
