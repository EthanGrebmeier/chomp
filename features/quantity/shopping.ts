import { entriesFor, normalize, record, records, validQuantity } from './model';
import { QuantityTransaction } from './transaction';
import type {
  Ingredient,
  QuantityEntry,
  QuantityState,
  ShoppingRow,
} from './types';

export type NewId = () => string;
export type Destination = {
  rowId?: string;
  store?: string;
  newRow?: ShoppingRow;
};

export function matchingRows(
  state: QuantityState,
  listId: string,
  item: Pick<Ingredient, 'name' | 'unit'>
) {
  return records(state, 'row').filter(
    row =>
      row.listId === listId &&
      row.status === 'active' &&
      normalize(row.name) === normalize(item.name) &&
      row.unit === normalize(item.unit)
  );
}

export function activeRow(tx: QuantityTransaction, rowId: string) {
  const row = record(tx.state, rowId, 'row');
  if (row.status !== 'active')
    throw new Error('Purchased and deleted quantities are read-only');
  tx.require(row);
  return row;
}

/** Callers choose a target explicitly; a missing target always keeps a separate row. */
export function addEntryToRow(
  tx: QuantityTransaction,
  newId: NewId,
  listId: string,
  item: Ingredient,
  entry: Omit<QuantityEntry, 'id' | 'rowId' | 'kind' | 'unit'>,
  destination: Destination = {}
) {
  if (!validQuantity(entry.quantity) || !item.name.trim())
    throw new Error('Enter a name and a valid quantity');
  const list = record(tx.state, listId, 'list');
  tx.require(list);
  let rowId: string;
  if (destination.rowId) {
    const row = activeRow(tx, destination.rowId);
    if (
      row.listId !== listId ||
      normalize(row.name) !== normalize(item.name) ||
      row.unit !== normalize(item.unit)
    )
      throw new Error('Only matching items with the same unit can combine');
    if (
      normalize(row.store) !== normalize(item.store) &&
      destination.store === undefined
    )
      throw new Error('Choose the store for the combined item');
    if (destination.store !== undefined && destination.store !== row.store)
      tx.put({ ...row, store: destination.store });
    rowId = row.id;
  } else if (destination.newRow) {
    const row = destination.newRow;
    if (
      tx.state.documents[row.id] ||
      row.listId !== listId ||
      row.status !== 'active' ||
      normalize(row.name) !== normalize(item.name) ||
      row.unit !== normalize(item.unit) ||
      row.store !== item.store
    )
      throw new Error('Invalid new shopping row');
    rowId = row.id;
    tx.put(row);
  } else {
    rowId = newId();
    tx.put({
      kind: 'row',
      id: rowId,
      listId,
      name: item.name.trim(),
      unit: normalize(item.unit),
      notes: item.notes,
      category: item.category,
      store: destination.store ?? item.store,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
  }
  const entryId = newId();
  tx.put({
    ...entry,
    kind: 'entry',
    id: entryId,
    rowId,
    unit: normalize(item.unit),
    sourceUnit: item.unit,
  });
  return rowId;
}

export function manualAdd(
  state: QuantityState,
  newId: NewId,
  listId: string,
  item: Ingredient,
  destination?: Destination
) {
  const tx = new QuantityTransaction(state);
  addEntryToRow(
    tx,
    newId,
    listId,
    item,
    {
      quantity: item.quantity,
      origin: 'manual',
      sourceName: '',
      sourceNotes: item.notes,
      sourceDate: '',
      mealTag: '',
      sourceId: null,
      mealId: null,
    },
    destination
  );
  return tx.build(newId(), `Add ${item.quantity} ${item.unit} ${item.name}`);
}

export function extraQuantity(
  state: QuantityState,
  newId: NewId,
  rowId: string,
  quantity: number
) {
  const row = record(state, rowId, 'row');
  return manualAdd(
    state,
    newId,
    row.listId,
    { ...row, quantity },
    { rowId, store: row.store }
  );
}

export function editQuantity(
  state: QuantityState,
  newId: NewId,
  entryId: string,
  quantity: number | null
) {
  const tx = new QuantityTransaction(state);
  const entry = record(state, entryId, 'entry');
  const row = activeRow(tx, entry.rowId);
  if (entry.sourceId) throw new Error('Edit this quantity in its meal plan');
  if (quantity !== null && !validQuantity(quantity))
    throw new Error('Enter a valid quantity');
  if (quantity === null) tx.remove(entry.id);
  else tx.put({ ...entry, quantity });
  return tx.build(
    newId(),
    quantity === null
      ? `Remove quantity from ${row.name}`
      : `Set ${row.name} quantity to ${quantity} ${row.unit}`
  );
}

export function editShoppingDetails(
  state: QuantityState,
  newId: NewId,
  rowId: string,
  details: Partial<Pick<ShoppingRow, 'name' | 'notes' | 'store' | 'category'>>
) {
  const tx = new QuantityTransaction(state);
  const row = activeRow(tx, rowId);
  const name = (details.name ?? row.name).trim();
  if (!name) throw new Error('An item needs a name');
  tx.put({ ...row, ...details, name });
  return tx.build(newId(), `Edit ${name}`);
}

/** Deselect every live source. Never touch sources when clearing history. */
export function detachSources(tx: QuantityTransaction, rowIds: string[]) {
  const sourceIds = new Set(
    rowIds.flatMap(rowId =>
      entriesFor(tx.state, rowId).flatMap(entry =>
        entry.sourceId ? [entry.sourceId] : []
      )
    )
  );
  for (const meal of records(tx.state, 'meal')) {
    if (meal.ingredients.some(i => sourceIds.has(i.id)))
      tx.put({
        ...meal,
        ingredients: meal.ingredients.map(i =>
          sourceIds.has(i.id) ? { ...i, selected: false } : i
        ),
      });
  }
}

export function deleteRows(
  state: QuantityState,
  newId: NewId,
  rowIds: string[]
) {
  const tx = new QuantityTransaction(state);
  const rows = rowIds.map(rowId => record(state, rowId, 'row'));
  detachSources(
    tx,
    rows.filter(r => r.status === 'active').map(r => r.id)
  );
  for (const row of rows) {
    tx.requireEntries(row.id);
    tx.put({ ...row, status: 'deleted' });
  }
  return tx.build(
    newId(),
    `Delete ${rows.length} shopping item${rows.length === 1 ? '' : 's'}`
  );
}

export function checkRow(state: QuantityState, newId: NewId, rowId: string) {
  const tx = new QuantityTransaction(state);
  const row = activeRow(tx, rowId);
  tx.requireEntries(rowId);
  tx.put({ ...row, status: 'checked' });
  return tx.build(newId(), `Purchase ${row.name}`);
}

/** Move is atomic, preserves individual quantities and detaches planned amounts. */
export function moveRow(
  state: QuantityState,
  newId: NewId,
  rowId: string,
  listId: string,
  destination: Destination = {}
) {
  const tx = new QuantityTransaction(state);
  const row = activeRow(tx, rowId);
  tx.require(record(state, listId, 'list'));
  if (row.listId === listId) throw new Error('Choose a different list');
  tx.requireEntries(rowId);
  detachSources(tx, [rowId]);
  let targetId = row.id;
  if (destination.rowId) {
    const target = activeRow(tx, destination.rowId);
    if (
      target.listId !== listId ||
      normalize(target.name) !== normalize(row.name) ||
      target.unit !== row.unit
    )
      throw new Error('Choose a matching item with the same unit');
    if (
      normalize(row.store) !== normalize(target.store) &&
      destination.store === undefined
    )
      throw new Error('Choose the destination store');
    targetId = target.id;
    if (destination.store !== undefined)
      tx.put({ ...target, store: destination.store });
    tx.put({ ...row, status: 'deleted' });
  } else tx.put({ ...row, listId });
  for (const entry of entriesFor(state, rowId))
    tx.put({
      ...entry,
      rowId: targetId,
      ...(entry.sourceId
        ? {
            sourceId: null,
            mealId: null,
            origin: 'manual' as const,
            sourceName: '',
            sourceDate: '',
            mealTag: '',
          }
        : {}),
    });
  return tx.build(newId(), `Move ${row.name}`);
}
