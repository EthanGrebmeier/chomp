import { describe, expect, it, vi } from 'vitest';

import { runBulkDelete } from '../delete-orchestrator';

describe('bulk delete orchestrator', () => {
  it('deletes selected items and runs success lifecycle when confirmed', async () => {
    const confirmDelete = vi.fn().mockResolvedValue(true);
    const deleteItems = vi.fn().mockResolvedValue(undefined);
    const onDeleteSuccess = vi.fn();
    const selectedItemIds = new Set(['item-1', 'item-2']);

    const result = await runBulkDelete({
      selectedItemIds,
      confirmDelete,
      deleteItems,
      onDeleteSuccess,
    });

    expect(result).toBe('deleted');
    expect(confirmDelete).toHaveBeenCalledWith(2);
    expect(deleteItems).toHaveBeenCalledWith(['item-1', 'item-2']);
    expect(onDeleteSuccess).toHaveBeenCalledTimes(1);
  });

  it('skips writes and lifecycle callbacks when delete is cancelled', async () => {
    const confirmDelete = vi.fn().mockResolvedValue(false);
    const deleteItems = vi.fn().mockResolvedValue(undefined);
    const onDeleteSuccess = vi.fn();

    const result = await runBulkDelete({
      selectedItemIds: new Set(['item-1']),
      confirmDelete,
      deleteItems,
      onDeleteSuccess,
    });

    expect(result).toBe('cancelled');
    expect(confirmDelete).toHaveBeenCalledWith(1);
    expect(deleteItems).not.toHaveBeenCalled();
    expect(onDeleteSuccess).not.toHaveBeenCalled();
  });

  it('does not run the success lifecycle when the delete write fails', async () => {
    const deleteItems = vi.fn().mockRejectedValue(new Error('offline'));
    const onDeleteSuccess = vi.fn();

    await expect(
      runBulkDelete({
        selectedItemIds: new Set(['meal-1-item', 'meal-2-item']),
        confirmDelete: vi.fn().mockResolvedValue(true),
        deleteItems,
        onDeleteSuccess,
      })
    ).rejects.toThrow('offline');

    expect(deleteItems).toHaveBeenCalledWith(['meal-1-item', 'meal-2-item']);
    expect(onDeleteSuccess).not.toHaveBeenCalled();
  });
});
