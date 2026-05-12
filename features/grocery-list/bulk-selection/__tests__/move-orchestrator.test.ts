import { describe, expect, it } from 'vitest';

import { buildBulkMoveSelectionPayload } from '../move-orchestrator';

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
