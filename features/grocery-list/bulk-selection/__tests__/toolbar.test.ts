import { describe, expect, it } from 'vitest';

import { getBulkToolbarActions } from '../toolbar';

describe('bulk toolbar actions', () => {
  it('returns actions in required order', () => {
    const actions = getBulkToolbarActions(1);

    expect(actions.map(action => action.id)).toEqual([
      'exit',
      'set-store',
      'set-category',
      'move',
      'delete',
    ]);
    expect(actions.map(action => action.label)).toEqual([
      'Exit Bulk Select',
      'Set Store',
      'Set Category',
      'Move',
      'Delete',
    ]);
  });

  it('marks delete as the only destructive action at the end', () => {
    const actions = getBulkToolbarActions(1);

    expect(actions.at(-1)?.id).toBe('delete');
    expect(
      actions.filter(action => action.isDestructive).map(action => action.id)
    ).toEqual(['delete']);
  });

  it('keeps exit enabled when no items are selected', () => {
    const actions = getBulkToolbarActions(0);
    const exitAction = actions.find(action => action.id === 'exit');
    const selectionRequiredActions = actions.filter(
      action => action.id !== 'exit'
    );

    expect(exitAction?.isDisabled).toBe(false);
    expect(selectionRequiredActions.every(action => action.isDisabled)).toBe(
      true
    );
  });

  it('enables all actions when at least one item is selected', () => {
    const actions = getBulkToolbarActions(3);

    expect(actions.every(action => !action.isDisabled)).toBe(true);
  });
});
