import { id } from '@instantdb/react-native';

import type {
  BaseGroceryItem,
  GroceryListItem,
} from '@/features/grocery-list/types';
import { db } from '@/lib/instant';

import { commitOperations } from '../commits';
import { buildCrossListMove } from '../cross-list-move';
import { quantityCommitStore } from '../instant-commit-store';
import { entriesFor, normalize, record, records } from '../model';
import {
  activeRow,
  deleteRows,
  editShoppingDetails,
  extraQuantity,
  manualAdd,
} from '../shopping';
import { QuantityTransaction } from '../transaction';
import type { ShoppingRow } from '../types';

import { ingredientFromApp } from './initialize';
import { changeDocument, documentSession, listSession } from './session';
import { chooseItemDestinations, type StoreReviewer } from './store-review';

export async function addManualQuantity(
  listId: string,
  item: BaseGroceryItem,
  savedItemId?: string,
  reviewConflicts?: StoreReviewer
) {
  const ingredient = ingredientFromApp(item);
  const destinations = await chooseItemDestinations(
    listId,
    [ingredient],
    reviewConflicts
  );
  const session = listSession(listId);
  const operation = manualAdd(
    session.state,
    id,
    listId,
    ingredient,
    destinations[ingredient.id]
  );
  if (savedItemId) {
    const addedEntry = operation.changes.find(
      c => c.value?.kind === 'entry'
    )?.value;
    if (addedEntry?.kind === 'entry') {
      const changedRow = operation.changes.find(
        c => c.id === addedEntry.rowId
      )?.value;
      const row =
        changedRow?.kind === 'row'
          ? changedRow
          : record(session.state, addedEntry.rowId, 'row');
      // Combining retains the existing row's saved-item identity and metadata.
      if (!row.savedItemId) {
        const change = operation.changes.find(c => c.id === row.id);
        const { version: _version, ...value } = row as ShoppingRow & {
          version?: string;
        };
        if (change) change.value = { ...value, savedItemId };
        else
          operation.changes.push({
            id: row.id,
            before: session.state.documents[row.id]?.version ?? null,
            value: { ...value, savedItemId },
          });
      }
    }
  }
  await session.send({ ...operation, syncSavedItems: true });
}
export function addExtraQuantity(itemId: string, quantity: number) {
  return changeDocument(itemId, state =>
    extraQuantity(state, id, itemId, quantity)
  );
}
export function updateQuantityRow(
  itemId: string,
  patch: Partial<GroceryListItem> & { storeId?: string }
) {
  return changeDocument(itemId, state => {
    const tx = new QuantityTransaction(state);
    const row = activeRow(tx, itemId);
    const entries = entriesFor(state, itemId);
    if (patch.quantity !== undefined || patch.unit !== undefined) {
      if (entries.length !== 1 || entries[0].sourceId)
        throw new Error('Adjust each quantity separately in the item sheet');
      const unit = normalize(patch.unit ?? row.unit);
      tx.put({
        ...entries[0],
        quantity: patch.quantity ?? entries[0].quantity,
        unit,
      });
      tx.put({ ...row, unit });
    }
    tx.put({
      ...row,
      unit: normalize(patch.unit ?? row.unit),
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(patch.category !== undefined ? { category: patch.category } : {}),
      ...(patch.storeId !== undefined ? { store: patch.storeId } : {}),
    });
    return { ...tx.build(id(), `Edit ${row.name}`), syncSavedItems: true };
  });
}
export async function deleteQuantityRows(itemIds: string[]) {
  const grouped = new Map<string, string[]>();
  for (const itemId of itemIds) {
    const { listId } = documentSession(itemId);
    grouped.set(listId, [...(grouped.get(listId) ?? []), itemId]);
  }
  for (const [listId, rowIds] of grouped) {
    const session = listSession(listId);
    await session.send(deleteRows(session.state, id, rowIds));
  }
}
export async function bulkQuantityMetadata(
  itemIds: string[],
  details: { store?: string; category?: string }
) {
  if (!itemIds.length) return;
  const session = documentSession(itemIds[0]);
  const tx = new QuantityTransaction(session.state);
  for (const itemId of itemIds) {
    const op = editShoppingDetails(session.state, id, itemId, details);
    for (const change of op.changes) if (change.value) tx.put(change.value);
  }
  await session.send({
    ...tx.build(id(), 'Update shopping details'),
    syncSavedItems: true,
  });
}

/** Both list operations claim their next server-unique slot in one transaction. */
export async function moveQuantityRows(
  itemIds: string[],
  destinationListId: string
) {
  if (!itemIds.length) return;
  const source = documentSession(itemIds[0]);
  const target = listSession(destinationListId);
  if (source.listId === destinationListId) return;
  if (
    source.connection !== 'authenticated' ||
    target.connection !== 'authenticated' ||
    source.pending.length ||
    target.pending.length
  )
    throw new Error('Let your changes finish syncing before moving items');
  const plans = buildCrossListMove(
    source.state,
    target.state,
    itemIds,
    destinationListId,
    id
  );
  const user = await db.getAuth();
  if (!user) throw new Error('Sign in first');
  await commitOperations(quantityCommitStore(user.id), plans, user.id, true);
  await Promise.all([source.refresh(), target.refresh()]);
}
export function quantityRowsInList(listId: string) {
  return records(listSession(listId).state, 'row');
}
