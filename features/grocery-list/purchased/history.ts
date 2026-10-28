import { format, isSameDay, startOfWeek, subDays, subWeeks } from 'date-fns';

import { records } from '@/features/quantity/model';
import type { QuantityState } from '@/features/quantity/types';
import type { Store } from '@/features/stores/types';

export type PurchasedItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  notes: string;
  category: string;
  storeId: string;
  storeName?: string;
  purchasedAt: string | null;
};

/** Cleared purchases retain their quantities; deleted unpurchased rows stay out. */
export function purchasedItems(
  state: QuantityState,
  stores: Store[] = []
): PurchasedItem[] {
  if (!state.complete) return [];
  const totals = new Map<string, number>();
  for (const entry of records(state, 'entry')) {
    totals.set(entry.rowId, (totals.get(entry.rowId) ?? 0) + entry.quantity);
  }
  const storeNames = new Map(stores.map(store => [store.id, store.name]));
  return records(state, 'row')
    .filter(
      row =>
        row.status === 'checked' ||
        (row.status === 'deleted' && row.purchasedAt !== undefined)
    )
    .filter(row => totals.has(row.id))
    .map(row => ({
      id: row.id,
      name: row.name,
      quantity: Math.round(totals.get(row.id)! * 1e6) / 1e6,
      unit: row.unit,
      notes: row.notes,
      category: row.category,
      storeId: row.store,
      storeName: storeNames.get(row.store),
      purchasedAt:
        row.purchasedAt && Number.isFinite(Date.parse(row.purchasedAt))
          ? row.purchasedAt
          : null,
    }))
    .sort(
      (a, b) =>
        (b.purchasedAt ? Date.parse(b.purchasedAt) : 0) -
          (a.purchasedAt ? Date.parse(a.purchasedAt) : 0) ||
        a.name.localeCompare(b.name) ||
        a.id.localeCompare(b.id)
    );
}

export function groupPurchases(
  items: PurchasedItem[],
  query: string,
  now = new Date()
) {
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = subWeeks(weekStart, 1);
  const yesterday = subDays(now, 1);
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const groups = new Map<
    string,
    { key: string; title: string; data: PurchasedItem[] }
  >();
  for (const item of items) {
    const searchable =
      `${item.name} ${item.storeName ?? ''} ${item.notes}`.toLocaleLowerCase();
    if (!words.every(word => searchable.includes(word))) continue;
    const date = item.purchasedAt ? new Date(item.purchasedAt) : null;
    const bucket = !date
      ? { key: 'earlier', title: 'Earlier purchases' }
      : isSameDay(date, now)
        ? { key: 'today', title: 'Today' }
        : isSameDay(date, yesterday)
          ? { key: 'yesterday', title: 'Yesterday' }
          : date >= weekStart && date <= now
            ? { key: 'this-week', title: 'This week' }
            : date >= lastWeekStart && date < weekStart
              ? { key: 'last-week', title: 'Last week' }
              : {
                  key: format(date, 'yyyy-MM'),
                  title: format(date, 'MMMM yyyy'),
                };
    const { key, title } = bucket;
    let group = groups.get(key);
    if (!group) {
      group = { key, title, data: [] };
      groups.set(key, group);
    }
    group.data.push(item);
  }
  return [...groups.values()];
}
