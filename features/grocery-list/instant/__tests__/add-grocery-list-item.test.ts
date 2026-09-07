import { beforeEach, describe, expect, it, vi } from 'vitest';

import { addGroceryListItem } from '../add-grocery-list-item';

type Transaction = {
  operation: 'create' | 'link' | 'unlink' | 'update';
  namespace: string;
  entityId: string;
  payload: unknown;
};

const { toastErrorMock, transactMock, upsertLocalSavedItemMock } = vi.hoisted(
  () => ({
    toastErrorMock: vi.fn(),
    transactMock: vi.fn(),
    upsertLocalSavedItemMock: vi.fn(),
  })
);

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
  transactMock.mockClear();
  toastErrorMock.mockReset();
  upsertLocalSavedItemMock.mockReset();
});

describe('addGroceryListItem', () => {
  it('optimistically sends all cloud writes in one child-linked transaction', () => {
    const transaction = createDeferred();
    transactMock.mockReturnValue(transaction.promise);

    const result = addGroceryListItem({
      listId: 'list-1',
      item: {
        name: 'Milk',
        quantity: 1,
        unit: 'gallon',
        category: 'Dairy',
        notes: 'Whole',
        storeId: 'store-new',
      },
      savedItemId: 'saved-1',
      selectedCloudSavedItemStoreId: 'store-old',
    });

    expect(result).toBe(transaction.promise);
    expect(transactMock).toHaveBeenCalledTimes(1);
    expect(transactMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          operation: 'link',
          namespace: 'grocery_items',
          entityId: 'item-1',
          payload: { grocery_list: 'list-1' },
        }),
        expect.objectContaining({
          operation: 'update',
          namespace: 'saved_items',
          entityId: 'saved-1',
        }),
        expect.objectContaining({
          operation: 'unlink',
          namespace: 'saved_items',
          entityId: 'saved-1',
          payload: { store: 'store-old' },
        }),
        expect.objectContaining({
          operation: 'link',
          namespace: 'saved_items',
          entityId: 'saved-1',
          payload: { store: 'store-new' },
        }),
      ])
    );
    expect(transactMock.mock.calls[0]?.[0]).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          namespace: 'grocery_lists',
          operation: 'link',
        }),
      ])
    );

    transaction.resolve();
  });

  it('schedules local saved-item persistence without waiting for server acknowledgment', () => {
    const transaction = createDeferred();
    const localPersistence = createDeferred();
    transactMock.mockReturnValue(transaction.promise);
    upsertLocalSavedItemMock.mockReturnValue(localPersistence.promise);

    const result = addGroceryListItem({
      listId: 'list-1',
      item: {
        name: 'Bananas',
        quantity: 6,
        unit: 'each',
      },
      selectedLocalSavedItemId: 'local-1',
    });

    expect(result).toBe(transaction.promise);
    expect(upsertLocalSavedItemMock).toHaveBeenCalledWith({
      item: {
        name: 'Bananas',
        quantity: 6,
        unit: 'each',
      },
      selectedLocalSavedItemId: 'local-1',
    });

    transaction.resolve();
    localPersistence.resolve();
  });

  it('reports local saved-item persistence failures independently', async () => {
    transactMock.mockReturnValue(Promise.resolve());
    upsertLocalSavedItemMock.mockRejectedValue(new Error('SQLite is locked'));

    addGroceryListItem({
      listId: 'list-1',
      item: {
        name: 'Bread',
        quantity: 1,
        unit: 'loaf',
      },
    });
    await Promise.resolve();

    expect(toastErrorMock).toHaveBeenCalledWith(
      'Item added, but saved item history could not be updated'
    );
  });
});
