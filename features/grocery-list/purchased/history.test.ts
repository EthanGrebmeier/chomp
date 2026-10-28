import { afterEach, describe, expect, it, vi } from 'vitest';

import { materialize, records } from '@/features/quantity/model';
import { checkRow, deleteRows, manualAdd } from '@/features/quantity/shopping';
import { QuantityTransaction } from '@/features/quantity/transaction';

import { groupPurchases, purchasedItems } from './history';

function fixture() {
  let sequence = 0;
  const id = () => `id-${++sequence}`;
  const tx = new QuantityTransaction(materialize([]));
  tx.put({ kind: 'list', id: 'list', name: 'Weekly shop' });
  const operations = [tx.build(id(), 'Create list')];
  const state = () => materialize(operations);
  operations.push(
    manualAdd(state(), id, 'list', {
      id: 'ingredient',
      name: 'Apples',
      quantity: 2,
      unit: 'each',
      store: '',
      notes: 'Green',
      category: 'produce',
    })
  );
  const row = records(state(), 'row')[0];
  return { id, operations, state, row };
}
afterEach(() => vi.useRealTimers());

describe('purchased history', () => {
  it('retains purchase date and quantity after clearing, without deleted unbought items', () => {
    const f = fixture();
    expect(purchasedItems(f.state())).toEqual([]);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-27T12:00:00Z'));
    f.operations.push(checkRow(f.state(), f.id, f.row.id));
    const purchase = purchasedItems(f.state())[0];
    expect(purchase.purchasedAt).toBe('2026-10-27T12:00:00.000Z');
    expect(purchase.quantity).toBe(2);
    f.operations.push(deleteRows(f.state(), f.id, [f.row.id]));
    expect(purchasedItems(f.state())).toEqual([purchase]);
    const other = fixture();
    other.operations.push(deleteRows(other.state(), other.id, [other.row.id]));
    expect(purchasedItems(other.state())).toEqual([]);
  });

  it('keeps legacy checked purchases in an undated group after clearing', () => {
    const f = fixture();
    const tx = new QuantityTransaction(f.state());
    tx.put({ ...f.row, status: 'checked' });
    f.operations.push(tx.build(f.id(), 'Legacy check'));
    f.operations.push(deleteRows(f.state(), f.id, [f.row.id]));
    expect(groupPurchases(purchasedItems(f.state()), '')[0].title).toBe(
      'Earlier purchases'
    );
  });

  it('groups local calendar days newest first and searches every query word', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 27, 23, 59));
    const f = fixture();
    f.operations.push(checkRow(f.state(), f.id, f.row.id));
    const base = purchasedItems(f.state())[0];
    const items = [
      {
        ...base,
        id: 'a',
        purchasedAt: new Date(2026, 9, 27, 23, 59).toISOString(),
        storeName: 'Market',
      },
      {
        ...base,
        id: 'b',
        purchasedAt: new Date(2026, 9, 27, 0, 1).toISOString(),
      },
      {
        ...base,
        id: 'c',
        purchasedAt: new Date(2026, 9, 26, 23, 59).toISOString(),
      },
    ];
    expect(groupPurchases(items, '').map(group => group.data.length)).toEqual([
      2, 1,
    ]);
    expect(
      groupPurchases(items, '  MARKET apple  ')[0].data.map(item => item.id)
    ).toEqual(['a']);
    expect(groupPurchases(items, 'banana')).toEqual([]);
    expect(purchasedItems({ ...f.state(), complete: false })).toEqual([]);
  });
  it('uses exclusive day, Monday-based week, and month buckets', () => {
    const f = fixture();
    f.operations.push(checkRow(f.state(), f.id, f.row.id));
    const base = purchasedItems(f.state())[0];
    const dates = [
      new Date(2026, 9, 29, 12),
      new Date(2026, 9, 28, 12),
      new Date(2026, 9, 27, 12),
      new Date(2026, 9, 26, 0),
      new Date(2026, 9, 25, 23, 59),
      new Date(2026, 9, 19, 0),
      new Date(2026, 9, 18, 23, 59),
      new Date(2026, 8, 30, 12),
      new Date(2025, 9, 30, 12),
    ];
    const items = dates.map((date, index) => ({
      ...base,
      id: String(index),
      purchasedAt: date.toISOString(),
    }));
    items.push({ ...base, id: 'undated', purchasedAt: null });
    const groups = groupPurchases(items, '', new Date(2026, 9, 29, 13));
    expect(groups.map(group => [group.title, group.data.length])).toEqual([
      ['Today', 1],
      ['Yesterday', 1],
      ['This week', 2],
      ['Last week', 2],
      ['October 2026', 1],
      ['September 2026', 1],
      ['October 2025', 1],
      ['Earlier purchases', 1],
    ]);
  });

  it('gives yesterday priority across a Monday and year boundary', () => {
    const f = fixture();
    f.operations.push(checkRow(f.state(), f.id, f.row.id));
    const base = purchasedItems(f.state())[0];
    const dates = [
      new Date(2024, 0, 1, 8),
      new Date(2023, 11, 31, 23),
      new Date(2023, 11, 25, 0),
      new Date(2023, 11, 24, 23),
    ];
    const groups = groupPurchases(
      dates.map((date, index) => ({
        ...base,
        id: String(index),
        purchasedAt: date.toISOString(),
      })),
      '',
      new Date(2024, 0, 1, 12)
    );
    expect(groups.map(group => group.title)).toEqual([
      'Today',
      'Yesterday',
      'Last week',
      'December 2023',
    ]);
  });
});
