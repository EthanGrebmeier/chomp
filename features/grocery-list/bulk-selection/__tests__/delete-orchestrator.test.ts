import { describe, expect, it, vi } from 'vitest';

import { runBulkDelete } from '../delete-orchestrator';

describe('bulk delete orchestrator', () => {
  it('exits selection before deleting selected items when confirmed', async () => {
    const callOrder: string[] = [];
    const confirmDelete = vi.fn().mockResolvedValue(true);
    const deleteItems = vi.fn(async () => {
      callOrder.push('delete');
    });
    const onDeleteConfirmed = vi.fn(() => {
      callOrder.push('confirmed');
    });
    const selectedItemIds = new Set(['item-1', 'item-2']);

    const result = await runBulkDelete({
      selectedItemIds,
      confirmDelete,
      deleteItems,
      onDeleteConfirmed,
    });

    expect(result).toBe('deleted');
    expect(confirmDelete).toHaveBeenCalledWith(2);
    expect(deleteItems).toHaveBeenCalledWith(['item-1', 'item-2']);
    expect(callOrder).toEqual(['confirmed', 'delete']);
  });

  it('skips writes and lifecycle callbacks when delete is cancelled', async () => {
    const confirmDelete = vi.fn().mockResolvedValue(false);
    const deleteItems = vi.fn().mockResolvedValue(undefined);
    const onDeleteConfirmed = vi.fn();

    const result = await runBulkDelete({
      selectedItemIds: new Set(['item-1']),
      confirmDelete,
      deleteItems,
      onDeleteConfirmed,
    });

    expect(result).toBe('cancelled');
    expect(confirmDelete).toHaveBeenCalledWith(1);
    expect(deleteItems).not.toHaveBeenCalled();
    expect(onDeleteConfirmed).not.toHaveBeenCalled();
  });

  it('surfaces delete write failures after exiting selection', async () => {
    const deleteItems = vi.fn().mockRejectedValue(new Error('offline'));
    const onDeleteConfirmed = vi.fn();

    await expect(
      runBulkDelete({
        selectedItemIds: new Set(['meal-1-item', 'meal-2-item']),
        confirmDelete: vi.fn().mockResolvedValue(true),
        deleteItems,
        onDeleteConfirmed,
      })
    ).rejects.toThrow('offline');

    expect(deleteItems).toHaveBeenCalledWith(['meal-1-item', 'meal-2-item']);
    expect(onDeleteConfirmed).toHaveBeenCalledTimes(1);
  });
});
