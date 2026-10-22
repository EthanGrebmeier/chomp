import { entriesFor, record } from './model';
import { deleteRows, type NewId } from './shopping';
import { QuantityTransaction } from './transaction';
import type { QuantityState } from './types';

export function buildCrossListMove(
  sourceState: QuantityState,
  targetState: QuantityState,
  itemIds: string[],
  destinationListId: string,
  newId: NewId
) {
  const sourceListId = record(sourceState, itemIds[0], 'row').listId;
  if (
    itemIds.some(
      itemId => record(sourceState, itemId, 'row').listId !== sourceListId
    )
  )
    throw new Error('Move items from one list at a time');
  const tx = new QuantityTransaction(targetState);
  const removal = new QuantityTransaction(sourceState);
  const deletion = deleteRows(sourceState, newId, itemIds);
  for (const change of deletion.changes)
    if (change.value) removal.put(change.value);
  for (const itemId of itemIds) {
    removal.requireEntries(itemId);
    for (const entry of entriesFor(sourceState, itemId)) {
      if (entry.sourceId)
        removal.put({ ...entry, sourceId: null, mealId: null });
    }
  }
  const remove = removal.build(newId(), 'Move items out of list');
  for (const itemId of itemIds) {
    const row = record(sourceState, itemId, 'row');
    if (row.status !== 'active')
      throw new Error('Only unchecked items can move');
    const rowId = newId();
    tx.put({ ...row, id: rowId, listId: destinationListId });
    for (const entry of entriesFor(sourceState, row.id))
      tx.put({
        ...entry,
        id: newId(),
        rowId,
        ...(entry.sourceId
          ? {
              sourceId: null,
              mealId: null,
              origin: 'manual',
              sourceName: '',
              sourceDate: '',
              mealTag: '',
            }
          : {}),
      });
  }
  const add = tx.build(newId(), 'Move shopping quantities');
  return [
    { workspaceId: sourceListId, operation: remove },
    { workspaceId: destinationListId, operation: add },
  ];
}
