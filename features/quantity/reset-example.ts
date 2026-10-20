import { initialOperations } from './fixtures';
import { materialize } from './model';
import { QuantityTransaction } from './transaction';
import type { QuantityState } from './types';

/** A new example is an auditable operation; previously saved intents remain intact. */
export function resetExample(state: QuantityState, newId: () => string) {
  const example = materialize(initialOperations(newId));
  if (!example.complete || example.conflicts.length)
    throw new Error('Could not prepare the example');
  const tx = new QuantityTransaction(state);
  for (const document of Object.values(state.documents)) tx.remove(document.id);
  for (const document of Object.values(example.documents)) tx.put(document);
  return tx.build(newId(), 'Start a fresh Apples example');
}
