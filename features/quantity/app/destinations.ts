import { Alert } from 'react-native';

import { db } from '@/lib/instant';

import { formatQuantity, totalFor } from '../model';
import { matchingRows, type Destination } from '../shopping';
import type { Ingredient, QuantityState } from '../types';

/** Explicit matching-unit decisions shared by manual, recipe and meal-plan adds. */
export async function chooseDestinations(
  state: QuantityState,
  listId: string,
  ingredients: Ingredient[]
) {
  const choices: Record<string, Destination> = {};
  const matches = ingredients
    .map(item => ({ item, rows: matchingRows(state, listId, item) }))
    .filter(m => m.rows.length);
  if (!matches.length) return choices;
  const { data } = await db.queryOnce({ stores: {} });
  const storeName = (store: string) =>
    data.stores.find(s => s.id === store)?.name ?? 'No store';
  for (const { item, rows } of matches) {
    choices[item.id] = await new Promise<Destination>((resolve, reject) => {
      Alert.alert(
        `Add ${item.name}`,
        `Add ${formatQuantity(item.quantity)} ${item.unit}. Keep it separate or add a contribution to an existing item.`,
        [
          { text: 'Keep separate', onPress: () => resolve({}) },
          ...rows.flatMap(row =>
            [...new Set([row.store, item.store])].map(store => ({
              text: `Combine with ${formatQuantity(totalFor(state, row.id) ?? 0)} ${row.unit} · ${storeName(store)}`,
              onPress: () => resolve({ rowId: row.id, store }),
            }))
          ),
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => reject(new Error('Addition cancelled')),
          },
        ],
        { cancelable: false }
      );
    });
  }
  return choices;
}
