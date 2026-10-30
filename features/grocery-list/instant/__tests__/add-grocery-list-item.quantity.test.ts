import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StoreReviewCancelledError } from '@/features/quantity/store-review-cancelled';

import { addGroceryListItem } from '../add-grocery-list-item';

type Transaction = {
  operation: 'create' | 'link' | 'unlink' | 'update';
  namespace: string;
  entityId: string;
  payload: unknown;
};

const {
  addManualQuantityMock,
  toastErrorMock,
  transactMock,
  upsertLocalSavedItemMock,
} = vi.hoisted(() => ({
  addManualQuantityMock: vi.fn(),
  toastErrorMock: vi.fn(),
  transactMock: vi.fn(),
  upsertLocalSavedItemMock: vi.fn(),
}));

vi.mock('sonner-native', () => ({
  toast: {
    error: toastErrorMock,
  },
}));

const createDeferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(promiseResolve => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
};

const createNamespace = (namespace: string) =>
  new Proxy(
    {},
    {
      get: (_target, entityId: string) => ({
        create: (payload: unknown): Transaction => ({
          operation: 'create',
          namespace,
          entityId,
          payload,
        }),
        link: (payload: unknown): Transaction => ({
          operation: 'link',
          namespace,
          entityId,
          payload,
        }),
        unlink: (payload: unknown): Transaction => ({
          operation: 'unlink',
          namespace,
          entityId,
          payload,
        }),
        update: (payload: unknown): Transaction => ({
          operation: 'update',
          namespace,
          entityId,
          payload,
        }),
      }),
    }
  );

vi.mock('@instantdb/react-native', () => ({
  id: () => 'item-1',
}));

vi.mock('../../../../lib/instant', () => ({
  db: {
    transact: transactMock,
    tx: new Proxy(
      {},
      {
        get: (_target, namespace: string) => createNamespace(namespace),
      }
    ),
  },
}));

vi.mock('../../../saved-items/local/upsert-local-saved-item', () => ({
  upsertLocalSavedItem: upsertLocalSavedItemMock,
}));

beforeEach(() => {
  addManualQuantityMock.mockReset();
  transactMock.mockReset();
  toastErrorMock.mockReset();
  upsertLocalSavedItemMock.mockReset();
});

const item = { name: 'Milk', quantity: 1, unit: 'each' };

vi.mock('@/features/quantity/app/grocery-actions', () => ({
  addManualQuantity: addManualQuantityMock,
}));

describe('addGroceryListItem', () => {
  it('waits for the durable quantity operation before recording history', async () => {
    const quantity = createDeferred();
    addManualQuantityMock.mockReturnValue(quantity.promise);
    transactMock.mockResolvedValue(undefined);
    const result = addGroceryListItem({
      listId: 'list',
      item,
      savedItemId: 'saved',
    });
    await vi.waitFor(() =>
      expect(addManualQuantityMock).toHaveBeenCalledWith(
        'list',
        item,
        'saved',
        undefined
      )
    );
    expect(transactMock).not.toHaveBeenCalled();
    quantity.resolve();
    await result;
    expect(transactMock).toHaveBeenCalledTimes(1);
    expect(
      transactMock.mock.calls[0][0].every(
        (tx: Transaction) => tx.namespace === 'grocery_item_add_events'
      )
    ).toBe(true);
    expect(upsertLocalSavedItemMock).not.toHaveBeenCalled();
  });
  it('forwards the originating sheet presenter to quantity addition', async () => {
    const reviewConflicts = vi.fn();
    addManualQuantityMock.mockResolvedValue(undefined);
    transactMock.mockResolvedValue(undefined);
    await addGroceryListItem({ listId: 'list', item, reviewConflicts });
    expect(addManualQuantityMock).toHaveBeenCalledWith(
      'list',
      item,
      undefined,
      reviewConflicts
    );
  });
  it('does not record history when adding the quantity fails', async () => {
    addManualQuantityMock.mockRejectedValue(new Error('Outbox unavailable'));
    await expect(addGroceryListItem({ listId: 'list', item })).rejects.toThrow(
      'Outbox unavailable'
    );
    expect(transactMock).not.toHaveBeenCalled();
    expect(upsertLocalSavedItemMock).not.toHaveBeenCalled();
  });
  it('preserves review cancellation without recording an addition or reporting a failure', async () => {
    const cancellation = new StoreReviewCancelledError();
    addManualQuantityMock.mockRejectedValue(cancellation);
    await expect(addGroceryListItem({ listId: 'list', item })).rejects.toBe(
      cancellation
    );
    expect(transactMock).not.toHaveBeenCalled();
    expect(upsertLocalSavedItemMock).not.toHaveBeenCalled();
    expect(toastErrorMock).not.toHaveBeenCalled();
  });
  it('honors the saved-item toggle', async () => {
    addManualQuantityMock.mockResolvedValue(undefined);
    transactMock.mockResolvedValue(undefined);
    await addGroceryListItem({
      listId: 'list',
      item,
      persistLocalSavedItem: false,
    });
    expect(upsertLocalSavedItemMock).not.toHaveBeenCalled();
    await addGroceryListItem({
      listId: 'list',
      item,
      selectedLocalSavedItemId: 'local',
    });
    expect(upsertLocalSavedItemMock).toHaveBeenCalledWith({
      item,
      selectedLocalSavedItemId: 'local',
    });
  });
  it('reports history failure without rejecting an already saved quantity', async () => {
    addManualQuantityMock.mockResolvedValue(undefined);
    transactMock.mockRejectedValue(new Error('History unavailable'));
    await expect(
      addGroceryListItem({ listId: 'list', item })
    ).resolves.toBeUndefined();
    expect(toastErrorMock).toHaveBeenCalledWith(
      'Quantity saved, but recent-item history could not be updated'
    );
  });
});

vi.mock('@/features/quantity/config', () => ({
  quantityWorkspaceAvailable: () => true,
}));
