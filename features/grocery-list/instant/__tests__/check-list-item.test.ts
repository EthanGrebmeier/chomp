import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getPendingCheckedState,
  resetPendingCheckedStateForTests,
} from '../../pending-checked-state';
import {
  CHECK_LIST_ITEM_MAX_ATTEMPTS,
  CHECK_LIST_ITEM_RETRY_DELAY_MS,
  checkListItem,
  isTransactionTimeoutError,
} from '../check-list-item';

const { updateGroceryItemsCheckedStateMock } = vi.hoisted(() => ({
  updateGroceryItemsCheckedStateMock: vi.fn(),
}));

vi.mock('../update-grocery-item-only', () => ({
  updateGroceryItemsCheckedState: updateGroceryItemsCheckedStateMock,
}));

const timeoutError = () => new Error('transaction timed out');

/** Resolves the pending timers so a retry can be scheduled and run. */
const advancePastRetryDelay = () =>
  vi.advanceTimersByTimeAsync(CHECK_LIST_ITEM_RETRY_DELAY_MS);

beforeEach(() => {
  vi.useFakeTimers();
  resetPendingCheckedStateForTests();
  updateGroceryItemsCheckedStateMock.mockReset();
  updateGroceryItemsCheckedStateMock.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('isTransactionTimeoutError', () => {
  it("matches the InstantDB client's mutation timeout", () => {
    expect(isTransactionTimeoutError(timeoutError())).toBe(true);
  });

  it('does not match other errors', () => {
    expect(isTransactionTimeoutError(new Error('permission denied'))).toBe(
      false
    );
    expect(isTransactionTimeoutError('transaction timed out')).toBe(false);
    expect(isTransactionTimeoutError(undefined)).toBe(false);
  });
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

  it('holds the intended state while the write is in flight and clears it after', async () => {
    let resolveWrite!: () => void;
    updateGroceryItemsCheckedStateMock.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveWrite = resolve;
        })
    );

    const update = checkListItem({ itemId: 'item-1', isChecked: true });

    expect(getPendingCheckedState().get('item-1')).toBe(true);

    resolveWrite();
    await update;

    expect(getPendingCheckedState().has('item-1')).toBe(false);
  });

  it('retries when the InstantDB client times the mutation out', async () => {
    updateGroceryItemsCheckedStateMock
      .mockRejectedValueOnce(timeoutError())
      .mockRejectedValueOnce(timeoutError())
      .mockResolvedValueOnce(undefined);

    const update = checkListItem({ itemId: 'item-1', isChecked: true });

    await advancePastRetryDelay();
    expect(getPendingCheckedState().get('item-1')).toBe(true);
    await advancePastRetryDelay();
    await update;

    expect(updateGroceryItemsCheckedStateMock).toHaveBeenCalledTimes(3);
    expect(updateGroceryItemsCheckedStateMock).toHaveBeenLastCalledWith([
      { itemId: 'item-1', isChecked: true },
    ]);
    expect(getPendingCheckedState().has('item-1')).toBe(false);
  });

  it('gives up after the retry budget and surfaces the timeout', async () => {
    updateGroceryItemsCheckedStateMock.mockRejectedValue(timeoutError());

    const update = checkListItem({ itemId: 'item-1', isChecked: true });
    const outcome = update.then(
      () => 'resolved' as const,
      (error: unknown) => error
    );

    for (let i = 0; i < CHECK_LIST_ITEM_MAX_ATTEMPTS; i += 1) {
      await advancePastRetryDelay();
    }

    await expect(outcome).resolves.toMatchObject({
      message: 'transaction timed out',
    });
    expect(updateGroceryItemsCheckedStateMock).toHaveBeenCalledTimes(
      CHECK_LIST_ITEM_MAX_ATTEMPTS
    );
    expect(getPendingCheckedState().has('item-1')).toBe(false);
  });

  it('does not retry non-timeout failures and propagates them', async () => {
    const error = new Error('permission denied');
    updateGroceryItemsCheckedStateMock.mockRejectedValue(error);

    await expect(
      checkListItem({
        itemId: 'item-1',
        isChecked: true,
      })
    ).rejects.toBe(error);

    expect(updateGroceryItemsCheckedStateMock).toHaveBeenCalledTimes(1);
    expect(getPendingCheckedState().has('item-1')).toBe(false);
  });

  it('stops retrying when a newer toggle supersedes the write', async () => {
    updateGroceryItemsCheckedStateMock
      .mockRejectedValueOnce(timeoutError())
      .mockResolvedValue(undefined);

    const staleUpdate = checkListItem({ itemId: 'item-1', isChecked: true });
    // Let the first attempt reject so the stale write is waiting to retry.
    await vi.advanceTimersByTimeAsync(0);

    const freshUpdate = checkListItem({ itemId: 'item-1', isChecked: false });
    expect(getPendingCheckedState().get('item-1')).toBe(false);

    await advancePastRetryDelay();
    await Promise.all([staleUpdate, freshUpdate]);

    // Stale: 1 failed attempt, no retry. Fresh: 1 successful attempt.
    expect(updateGroceryItemsCheckedStateMock).toHaveBeenCalledTimes(2);
    expect(updateGroceryItemsCheckedStateMock).toHaveBeenLastCalledWith([
      { itemId: 'item-1', isChecked: false },
    ]);
    expect(getPendingCheckedState().has('item-1')).toBe(false);
  });

  it('keeps a newer intent when an older write settles late', async () => {
    let resolveStaleWrite!: () => void;
    let resolveFreshWrite!: () => void;
    updateGroceryItemsCheckedStateMock
      .mockImplementationOnce(
        () =>
          new Promise<void>(resolve => {
            resolveStaleWrite = resolve;
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise<void>(resolve => {
            resolveFreshWrite = resolve;
          })
      );

    const staleUpdate = checkListItem({ itemId: 'item-1', isChecked: true });
    const freshUpdate = checkListItem({ itemId: 'item-1', isChecked: false });

    resolveStaleWrite();
    await staleUpdate;
    expect(getPendingCheckedState().get('item-1')).toBe(false);

    resolveFreshWrite();
    await freshUpdate;
    expect(getPendingCheckedState().has('item-1')).toBe(false);
  });
});
