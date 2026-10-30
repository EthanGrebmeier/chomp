export const FREQUENT_ITEMS_WINDOW_DAYS = 90;
export const FREQUENT_ITEMS_LIMIT = 20;
export const FREQUENT_ITEMS_MIN_ADDITIONS = 2;

const WINDOW_MS = FREQUENT_ITEMS_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export type GroceryItemAddEvent = {
  id: string;
  normalizedName: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string | null;
  notes?: string | null;
  addedAt: string;
  store?: {
    id: string;
    name: string;
  } | null;
};

export type CurrentGroceryItem = {
  name: string;
  isChecked: boolean;
  isDeleted?: boolean;
};

export type FrequentItem = {
  normalizedName: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string | null;
  notes?: string | null;
  storeId?: string;
  storeName?: string;
  count: number;
  lastAddedAt: string;
};

export const normalizeGroceryItemName = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, ' ');

export const getFrequentItemsCutoff = (now = new Date()): string =>
  new Date(now.getTime() - WINDOW_MS).toISOString();

export const getFrequentItemsQueryCutoff = (now = new Date()): string => {
  const cutoff = new Date(now.getTime() - WINDOW_MS);
  cutoff.setUTCHours(0, 0, 0, 0);
  return cutoff.toISOString();
};

/** Aggregate history independently of the current shopping list. Do not limit
 * here: excluding active names must happen before taking the top 20. */
export const rankFrequentItems = (
  events: GroceryItemAddEvent[],
  now = new Date()
): FrequentItem[] => {
  const cutoff = getFrequentItemsCutoff(now);
  const grouped = new Map<string, FrequentItem>();

  for (const event of events) {
    if (event.addedAt < cutoff) continue;

    const normalizedName =
      event.normalizedName || normalizeGroceryItemName(event.name);
    const existing = grouped.get(normalizedName);

    if (!existing) {
      grouped.set(normalizedName, {
        normalizedName,
        name: event.name,
        quantity: event.quantity,
        unit: event.unit,
        category: event.category,
        notes: event.notes,
        storeId: event.store?.id,
        storeName: event.store?.name,
        count: 1,
        lastAddedAt: event.addedAt,
      });
      continue;
    }

    existing.count += 1;
    if (event.addedAt > existing.lastAddedAt) {
      existing.name = event.name;
      existing.quantity = event.quantity;
      existing.unit = event.unit;
      existing.category = event.category;
      existing.notes = event.notes;
      existing.storeId = event.store?.id;
      existing.storeName = event.store?.name;
      existing.lastAddedAt = event.addedAt;
    }
  }

  return [...grouped.values()]
    .filter(item => item.count >= FREQUENT_ITEMS_MIN_ADDITIONS)
    .sort(
      (left, right) =>
        right.count - left.count ||
        right.lastAddedAt.localeCompare(left.lastAddedAt)
    );
};

/** Keeps candidate identities stable when only shopping quantities change. */
export const selectFrequentItems = (
  ranked: FrequentItem[],
  currentItems: CurrentGroceryItem[]
): FrequentItem[] => {
  const uncheckedNames = new Set(
    currentItems
      .filter(item => !item.isDeleted && !item.isChecked)
      .map(item => normalizeGroceryItemName(item.name))
  );
  return ranked
    .filter(item => !uncheckedNames.has(item.normalizedName))
    .slice(0, FREQUENT_ITEMS_LIMIT);
};

export const buildFrequentItems = ({
  events,
  currentItems,
  now = new Date(),
}: {
  events: GroceryItemAddEvent[];
  currentItems: CurrentGroceryItem[];
  now?: Date;
}): FrequentItem[] =>
  selectFrequentItems(rankFrequentItems(events, now), currentItems);
