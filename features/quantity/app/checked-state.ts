import { id } from '@instantdb/react-native';

import { record } from '../model';
import { QuantityTransaction } from '../transaction';

import {
  documentSession,
  listSession,
  sendAndObserveListOperation,
} from './session';

// Build each toggle against the preceding durable, published state. This keeps
// rapid toggles from creating competing version guards against a stale session.
const checkedWrites = new Map<string, Promise<void>>();

export async function updateQuantityChecked(
  updates: { itemId: string; isChecked: boolean }[]
) {
  const grouped = new Map<string, typeof updates>();
  for (const update of updates) {
    const { listId } = documentSession(update.itemId);
    grouped.set(listId, [...(grouped.get(listId) ?? []), update]);
  }
  for (const [listId, values] of grouped) {
    const write = (checkedWrites.get(listId) ?? Promise.resolve())
      .catch(() => {})
      .then(async () => {
        const session = listSession(listId);
        const tx = new QuantityTransaction(session.state);
        for (const { itemId, isChecked } of values) {
          const row = record(session.state, itemId, 'row');
          if (row.status === 'deleted')
            throw new Error('Item has been deleted');
          tx.requireEntries(row.id);
          tx.put({ ...row, status: isChecked ? 'checked' : 'active' });
        }
        await sendAndObserveListOperation(
          listId,
          tx.build(id(), 'Update purchased items')
        );
      });
    checkedWrites.set(listId, write);
    try {
      await write;
    } finally {
      if (checkedWrites.get(listId) === write) checkedWrites.delete(listId);
    }
  }
}
