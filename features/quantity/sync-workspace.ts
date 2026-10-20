import { id } from '@instantdb/react-native';

import { db } from '@/lib/instant';

import { materialize } from './model';
import type { Operation } from './types';

export type Pending = { operation: Operation; error?: string };

export const operationChunk = (
  operation: Operation,
  workspaceId: string,
  authorId: string
) =>
  db.tx.gqc_operations_v1[operation.id]
    .update({ workspaceId, authorId, body: JSON.stringify(operation) })
    .link({ workspace: workspaceId });

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
      const existing = await db.queryOnce(
        { gqc_operations_v1: { $: { where: { id: item.operation.id } } } },
        { ruleParams: { quantityRetry: id() } }
      );
      const saved = existing.data.gqc_operations_v1[0];
      if (saved) {
        if (
          saved.workspaceId !== workspaceId ||
          saved.authorId !== userId ||
          saved.body !== JSON.stringify(item.operation)
        )
          throw new Error('Operation identity collision');
        confirm(pendingItem.operation);
        await afterConfirm?.(pendingItem.operation);
        await changePending(values =>
          values.filter(p => p.operation.id !== pendingItem.operation.id)
        );
        continue;
      }
      const result = await db.transact(
        operationChunk(item.operation, workspaceId, userId)
      );
      if (result.status === 'synced') {
        confirm(pendingItem.operation);
        await afterConfirm?.(pendingItem.operation);
        await changePending(values =>
          values.filter(p => p.operation.id !== pendingItem.operation.id)
        );
      } else break;
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
    for (const item of pending.filter(p => !p.error))
      operations.push(item.operation);
    return materialize(operations);
  } catch {
    return {
      ...materialize([]),
      complete: false,
      error: 'Saved quantity history could not be read',
    };
  }
}
