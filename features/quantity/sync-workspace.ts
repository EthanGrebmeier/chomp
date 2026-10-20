import { commitOperations } from './commits';
import { quantityCommitStore } from './instant-commit-store';
import { materialize } from './model';
import type { Operation } from './types';

export { operationChunk } from './operation-chunk';
export type Pending = { operation: Operation; error?: string };

export async function flushOutbox({
  workspaceId,
  userId,
  getPending,
  changePending,
  confirm,
  afterConfirm,
}: {
  workspaceId: string;
  userId: string;
  getPending: () => Pending[];
  changePending: (change: (values: Pending[]) => Pending[]) => Promise<void>;
  confirm: (operation: Operation) => void;
  afterConfirm?: (operation: Operation) => Promise<void>;
}) {
  let item: Pending | undefined;
  while ((item = getPending().find(p => !p.error))) {
    const pendingItem = item;
    try {
      const [committed] = await commitOperations(
        quantityCommitStore(userId),
        [{ workspaceId, operation: pendingItem.operation }],
        userId
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
  workspaceCount?: number
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
    let optimistic = materialize(operations);
    for (const item of pending.filter(
      p => !p.error && !savedIds.has(p.operation.id)
    )) {
      const operation = {
        ...item.operation,
        parents: [...new Set([...item.operation.parents, ...optimistic.heads])],
      };
      operations.push(operation);
      optimisticIds.add(operation.id);
      optimistic = materialize(operations, optimisticIds);
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
