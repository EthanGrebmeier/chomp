import { beforeEach, describe, expect, it, vi } from 'vitest';

import { checkListItem } from '../check-list-item';

const { updateGroceryItemsCheckedStateMock } = vi.hoisted(() => ({
  updateGroceryItemsCheckedStateMock: vi.fn(),
}));

vi.mock('../update-grocery-item-only', () => ({
  updateGroceryItemsCheckedState: updateGroceryItemsCheckedStateMock,
}));

beforeEach(() => {
  updateGroceryItemsCheckedStateMock.mockReset();
  updateGroceryItemsCheckedStateMock.mockResolvedValue(undefined);
});

describe('checkListItem', () => {
  it('writes each checked-state change immediately', async () => {
    const firstUpdate = checkListItem({
      itemId: 'item-1',
      isChecked: true,
    });
    const secondUpdate = checkListItem({
      itemId: 'item-2',
      isChecked: true,
    });

    expect(updateGroceryItemsCheckedStateMock).toHaveBeenNthCalledWith(1, [
      { itemId: 'item-1', isChecked: true },
    ]);
    expect(updateGroceryItemsCheckedStateMock).toHaveBeenNthCalledWith(2, [
      { itemId: 'item-2', isChecked: true },
    ]);

    await Promise.all([firstUpdate, secondUpdate]);
  });

  it('propagates write failures so the UI can report them', async () => {
    const error = new Error('permission denied');
    updateGroceryItemsCheckedStateMock.mockRejectedValue(error);

    await expect(
      checkListItem({
        itemId: 'item-1',
        isChecked: true,
      })
    ).rejects.toBe(error);
  });
});
