import type { GroceryListItemWithRecipe } from '../types';

export type ShoppingDestination = {
  storeId: string | null;
  name: string;
  remaining: number;
};

export type ShoppingSession =
  | { screen: 'picker' }
  | { screen: 'store'; storeId: string | null; storeName?: string };

const storeNameKey = (name: string) =>
  name.trim().toLowerCase().replace(/\s+/g, ' ');

export function getShoppingItems(
  items: GroceryListItemWithRecipe[],
  destination: ShoppingDestination
) {
  return items.filter(
    item =>
      !item.isDeleted &&
      (destination.storeId === null
        ? !item.store
        : Boolean(
            item.store &&
            storeNameKey(item.store.name) === storeNameKey(destination.name)
          ))
  );
}

export function findShoppingDestination(
  destinations: ShoppingDestination[],
  items: GroceryListItemWithRecipe[],
  session: ShoppingSession
) {
  if (session.screen !== 'store') return undefined;
  if (session.storeId === null) {
    return destinations.find(destination => destination.storeId === null);
  }
  // Resolve older ID-only sessions and renamed stores before using the saved name.
  const currentStore = items.find(
    item => !item.isDeleted && item.store?.id === session.storeId
  )?.store;
  const name = currentStore?.name ?? session.storeName;
  return destinations.find(
    destination =>
      destination.storeId !== null &&
      (name !== undefined
        ? storeNameKey(destination.name) === storeNameKey(name)
        : destination.storeId === session.storeId)
  );
}

export function getShoppingDestinations(items: GroceryListItemWithRecipe[]) {
  const destinations = new Map<string | null, ShoppingDestination>();
  for (const item of items) {
    if (item.isDeleted) continue;
    const storeId = item.store?.id ?? null;
    const key = item.store ? storeNameKey(item.store.name) : null;
    const destination = destinations.get(key) ?? {
      storeId,
      name: item.store?.name ?? 'No store',
      remaining: 0,
    };
    if (!item.isChecked) destination.remaining += 1;
    destinations.set(key, destination);
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
