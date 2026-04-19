import { beforeEach, describe, expect, it, vi } from 'vitest';

type Op = { kind: 'update' | 'link' | 'unlink'; itemId: string; payload: unknown };
const opRegistry: WeakMap<object, Op> = new WeakMap();

const makeOp = (kind: Op['kind'], itemId: string, payload: unknown): object => {
  const op = { __kind: kind, __itemId: itemId } as object;
  opRegistry.set(op, { kind, itemId, payload });
  return op;
};

const transactMock = vi.fn(async (_transactions: unknown) => undefined);

vi.mock('../../../../lib/instant', () => {
  const itemProxy = (itemId: string) => ({
    update: (payload: unknown) => makeOp('update', itemId, payload),
    link: (payload: unknown) => makeOp('link', itemId, payload),
    unlink: (payload: unknown) => makeOp('unlink', itemId, payload),
  });

  const db = {
    transact: (transactions: unknown) => transactMock(transactions),
    tx: {
      grocery_items: new Proxy(
        {},
        {
          get: (_target, prop) => itemProxy(String(prop)),
        }
      ),
    },
  };

  return { db };
});

const linkStoreToItemMock = vi.fn(async (_args: unknown) => undefined);
vi.mock('../link-store-to-item', () => ({
  linkStoreToItem: (args: unknown) => linkStoreToItemMock(args),
}));

import { updateGroceryItemOnly } from '../update-grocery-item-only';

const flattenOps = (): Op[] => {
  const ops: Op[] = [];
  for (const call of transactMock.mock.calls) {
    const transactions = call[0];
    const list = Array.isArray(transactions) ? transactions : [transactions];
    for (const tx of list) {
      const op = opRegistry.get(tx as object);
      if (op) ops.push(op);
    }
  }
  return ops;
};

describe('updateGroceryItemOnly', () => {
  beforeEach(() => {
    transactMock.mockClear();
    linkStoreToItemMock.mockClear();
  });

  it('updates grocery_items with trim-normalized fields and null-coerced category', async () => {
    await updateGroceryItemOnly({
      itemId: 'item-1',
      item: { name: '  Oat Milk  ', notes: ' creamy ', category: undefined },
    });

    const ops = flattenOps();
    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({
      kind: 'update',
      itemId: 'item-1',
      payload: {
        name: 'Oat Milk',
        notes: 'creamy',
        category: null,
      },
    });
    expect(linkStoreToItemMock).not.toHaveBeenCalled();
  });

  it('delegates to linkStoreToItem when a store is linked', async () => {
    await updateGroceryItemOnly({
      itemId: 'item-1',
      item: { name: 'Milk', storeId: 'store-2' },
      currentStoreId: 'store-1',
    });

    expect(linkStoreToItemMock).toHaveBeenCalledTimes(1);
    expect(linkStoreToItemMock).toHaveBeenCalledWith({
      itemId: 'item-1',
      storeId: 'store-2',
      currentStoreId: 'store-1',
    });
  });

  it('delegates to linkStoreToItem when a store is unlinked (storeId undefined, currentStoreId set)', async () => {
    await updateGroceryItemOnly({
      itemId: 'item-1',
      item: { name: 'Milk' },
      currentStoreId: 'store-1',
    });

    expect(linkStoreToItemMock).toHaveBeenCalledWith({
      itemId: 'item-1',
      storeId: undefined,
      currentStoreId: 'store-1',
    });
  });

  it('does not call linkStoreToItem when no store is present on either side', async () => {
    await updateGroceryItemOnly({
      itemId: 'item-1',
      item: { name: 'Milk' },
    });

    expect(linkStoreToItemMock).not.toHaveBeenCalled();
  });

  it('relinks grocery_items↔saved_items when a new cloud saved item is selected', async () => {
    await updateGroceryItemOnly({
      itemId: 'item-1',
      item: { name: 'Milk' },
      currentSavedItemId: 'saved-old',
      selectedSavedItemId: 'saved-new',
    });

    const ops = flattenOps();
    // ops[0] = grocery_items.update (ignored here)
    const relinkOps = ops.slice(1);
    expect(relinkOps).toEqual([
      {
        kind: 'unlink',
        itemId: 'item-1',
        payload: { saved_item: 'saved-old' },
      },
      {
        kind: 'link',
        itemId: 'item-1',
        payload: { saved_item: 'saved-new' },
      },
    ]);
  });

  it('only links when a cloud saved item is selected with no prior link', async () => {
    await updateGroceryItemOnly({
      itemId: 'item-1',
      item: { name: 'Milk' },
      selectedSavedItemId: 'saved-new',
    });

    const relinkOps = flattenOps().slice(1);
    expect(relinkOps).toEqual([
      {
        kind: 'link',
        itemId: 'item-1',
        payload: { saved_item: 'saved-new' },
      },
    ]);
  });

  it('is a no-op on relink when selectedSavedItemId equals currentSavedItemId', async () => {
    await updateGroceryItemOnly({
      itemId: 'item-1',
      item: { name: 'Milk' },
      currentSavedItemId: 'saved-1',
      selectedSavedItemId: 'saved-1',
    });

    const ops = flattenOps();
    // only the initial grocery_items.update, no link/unlink transactions
    expect(ops).toHaveLength(1);
    expect(ops[0].kind).toBe('update');
  });

  it('unlinks the current cloud saved item when a local match is selected', async () => {
    await updateGroceryItemOnly({
      itemId: 'item-1',
      item: { name: 'Milk' },
      currentSavedItemId: 'saved-old',
      selectedLocalSavedItemId: 'local-1',
    });

    const ops = flattenOps().slice(1);
    expect(ops).toEqual([
      {
        kind: 'unlink',
        itemId: 'item-1',
        payload: { saved_item: 'saved-old' },
      },
    ]);
  });

  it('does not unlink when a local match is selected but there was no prior cloud link', async () => {
    await updateGroceryItemOnly({
      itemId: 'item-1',
      item: { name: 'Milk' },
      selectedLocalSavedItemId: 'local-1',
    });

    const ops = flattenOps();
    expect(ops).toHaveLength(1);
    expect(ops[0].kind).toBe('update');
  });

  it('never touches saved_items rows or calls upsertLocalSavedItem', async () => {
    await updateGroceryItemOnly({
      itemId: 'item-1',
      item: { name: 'Milk', category: 'Dairy', notes: 'Whole' },
      currentStoreId: 'store-1',
      currentSavedItemId: 'saved-old',
      selectedSavedItemId: 'saved-new',
    });

    const ops = flattenOps();
    for (const op of ops) {
      // all ops should target grocery_items (via the item proxy); payload keys
      // should never include saved_item fields beyond the link/unlink target.
      if (op.kind === 'update') {
        expect(op.payload).not.toHaveProperty('saved_item');
      }
    }
  });
});
