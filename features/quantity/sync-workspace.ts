import { commitOperations } from './commits';
import { quantityCommitStore } from './instant-commit-store';
import { materialize } from './model';
import type { Operation } from './types';

export { operationChunk } from './operation-chunk';
export type Pending = { operation: Operation; error?: string };

/** Retain one copy of each exact operation. Conflicting payloads with the same
 * identity remain present so replay can reject them rather than hide corruption. */
export function mergeConfirmedOperations(
  previous: Operation[],
  incoming: Operation[]
) {
  const seen = new Set<string>();
  const merged: Operation[] = [];
  for (const operation of [...previous, ...incoming]) {
    const key = JSON.stringify(operation);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(operation);
  }
  return merged.length === previous.length &&
    merged.every((op, index) => op === previous[index])
    ? previous
    : merged;
}

export async function flushOutbox({
  workspaceId,
  userId,
  getPending,
  changePending,
  confirm,
  afterConfirm,
  replay,
}: {
  workspaceId: string;
  userId: string;
  getPending: () => Pending[];
  changePending: (change: (values: Pending[]) => Pending[]) => Promise<void>;
  confirm: (operation: Operation) => void;
  afterConfirm?: (operation: Operation) => Promise<void>;
  replay?: typeof materialize;
}) {
  let item: Pending | undefined;
  while ((item = getPending().find(p => !p.error))) {
    const pendingItem = item;
    try {
      const [committed] = await commitOperations(
        quantityCommitStore(userId),
        [{ workspaceId, operation: pendingItem.operation }],
        userId,
        false,
        replay
      );
      confirm(committed.operation);
      await afterConfirm?.(committed.operation);
      await changePending(values =>
        values.filter(p => p.operation.id !== pendingItem.operation.id)
      );
    } catch {
      await changePending(values =>
        values.map(p =>
          p.operation.id === pendingItem.operation.id
            ? {
                ...p,
                error:
                  'Could not sync this change. Your original action is saved for retry.',
              }
            : p
        )
      );
    }
  }
}

export function readWorkspaceState(
  confirmed: Operation[],
  pending: Pending[],
  rows: { id: string; body: string }[],
  workspaceCount?: number,
  replay: typeof materialize = materialize
) {
  try {
    if (workspaceCount !== undefined && workspaceCount !== 1)
      return materialize([]);
    const operations: Operation[] = [];
    for (const operation of confirmed) operations.push(operation);
    for (const row of rows) {
      const operation = JSON.parse(row.body) as Operation;
      if (operation.id !== row.id)
        throw new Error('Invalid operation identity');
      operations.push(operation);
    }
    const savedIds = new Set(operations.map(op => op.id));
    const optimisticIds = new Set<string>();
    // Optimistic intents follow the server-confirmed prefix, even when authored
    // offline against older heads. Their original version guards stay intact.
    let optimistic = replay(operations);
    for (const item of pending.filter(
      p => !p.error && !savedIds.has(p.operation.id)
    )) {
      const operation = {
        ...item.operation,
        parents: [...new Set([...item.operation.parents, ...optimistic.heads])],
      };
      operations.push(operation);
      optimisticIds.add(operation.id);
      optimistic = replay(operations, optimisticIds);
    }
    return optimistic;
  } catch {
    return {
      ...materialize([]),
      complete: false,
      error: 'Saved quantity history could not be read',
    };
  }
}
