import { describe, expect, it } from 'vitest';

import { getBulkToolbarActions } from '../toolbar';

describe('bulk toolbar actions', () => {
  it('returns actions in required order', () => {
    const actions = getBulkToolbarActions(1);

    expect(actions.map(action => action.id)).toEqual([
      'set-store',
      'set-category',
      'move',
      'delete',
    ]);
    expect(actions.map(action => action.label)).toEqual([
      'Set Store',
      'Set Category',
      'Move',
      'Delete',
    ]);
  });

  it('marks delete as the only destructive action at the end', () => {
    const actions = getBulkToolbarActions(1);

    expect(actions.at(-1)?.id).toBe('delete');
    expect(actions.filter(action => action.isDestructive).map(action => action.id)).toEqual([
      'delete',
    ]);
  });

  it('disables all actions when no items are selected', () => {
    const actions = getBulkToolbarActions(0);

    expect(actions.every(action => action.isDisabled)).toBe(true);
  });

  it('enables all actions when at least one item is selected', () => {
    const actions = getBulkToolbarActions(3);

    expect(actions.every(action => !action.isDisabled)).toBe(true);
  });
});
