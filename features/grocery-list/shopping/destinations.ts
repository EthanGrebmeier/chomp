import type { GroceryListItemWithRecipe } from '../types';

export type ShoppingDestination = {
  storeId: string | null;
  name: string;
  remaining: number;
};

export type ShoppingSession =
  | { screen: 'picker' }
  | { screen: 'store'; storeId: string | null; storeName?: string };

export function getShoppingDestinations(items: GroceryListItemWithRecipe[]) {
  const destinations = new Map<string | null, ShoppingDestination>();
  for (const item of items) {
    if (item.isDeleted) continue;
    const storeId = item.store?.id ?? null;
    const destination = destinations.get(storeId) ?? {
      storeId,
      name: item.store?.name ?? 'No store',
      remaining: 0,
    };
    if (!item.isChecked) destination.remaining += 1;
    destinations.set(storeId, destination);
  }
  return [...destinations.values()].sort((a, b) => {
    if (a.storeId === null) return 1;
    if (b.storeId === null) return -1;
    return a.name.localeCompare(b.name);
  });
}

export function parseShoppingSession(
  value: string | null
): ShoppingSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (parsed?.screen === 'picker') return { screen: 'picker' };
    if (
      parsed?.screen === 'store' &&
      (parsed.storeId === null || typeof parsed.storeId === 'string')
    ) {
      return {
        screen: 'store',
        storeId: parsed.storeId,
        ...(typeof parsed.storeName === 'string'
          ? { storeName: parsed.storeName }
          : {}),
      };
    }
  } catch {
    // An invalid local preference should never prevent opening the list.
  }
  return null;
}
