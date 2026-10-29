import { createMaterializer, materialize } from './model';
import type { Operation } from './types';

export type StoredOperation = {
  id: string;
  workspaceId: string;
  authorId: string;
  body: string;
  serialKey?: string | null;
};
export type CommitPlan = { workspaceId: string; operation: Operation };
export type CommitStore = {
  read: (workspaceId: string) => Promise<StoredOperation[]>;
  /** All records (and any external lifecycle writes) must share one transaction. */
  write: (plans: CommitPlan[]) => Promise<{ status: string }>;
};
export const serialKey = (workspaceId: string, operation: Operation) =>
  operation.commit ? `${workspaceId}:${operation.commit.sequence}` : undefined;

export function decodeHistory(rows: StoredOperation[]) {
  return rows.map(row => {
    const operation = JSON.parse(row.body) as Operation;
    if (
      operation.id !== row.id ||
      (operation.commit &&
        row.serialKey !== serialKey(row.workspaceId, operation))
    )
      throw new Error('Invalid committed operation');
    return operation;
  });
}
export function sameIntent(a: Operation, b: Operation) {
  const { commit: _a, ...left } = a;
  const { commit: _b, ...right } = b;
  return JSON.stringify(left) === JSON.stringify(right);
}

/**
 * Each write claims the next unique slot in every affected list. A concurrent
 * writer can win a slot, but cannot partially commit this batch. Re-read after
 * contention; validate the original intent, never silently rebase its changes.
 */
export async function commitOperations(
  store: CommitStore,
  plans: CommitPlan[],
  authorId: string,
  requireApplicable = false,
  replay: typeof materialize = createMaterializer()
): Promise<CommitPlan[]> {
  if (
    !plans.length ||
    new Set(plans.map(p => p.workspaceId)).size !== plans.length
  )
    throw new Error('A commit needs one operation per list');
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    const histories = await Promise.all(
      plans.map(p => store.read(p.workspaceId))
    );
    const existing = histories.map((rows, index) =>
      rows.find(row => row.id === plans[index].operation.id)
    );
    if (existing.some(Boolean)) {
      if (!existing.every(Boolean))
        throw new Error(
          'Incomplete multi-list commit; keep the lists unchanged and retry'
        );
      return existing.map((row, index) => {
        const saved = row!;
        const operation = decodeHistory([saved])[0];
        if (
          saved.authorId !== authorId ||
          saved.workspaceId !== plans[index].workspaceId ||
          !sameIntent(operation, plans[index].operation)
        )
          throw new Error('Operation identity collision');
        return { workspaceId: saved.workspaceId, operation };
      });
    }
    const prepared = plans.map((plan, index) => {
      const history = decodeHistory(histories[index]);
      const state = replay(history);
      if (!state.complete)
        throw new Error(state.error ?? 'Incomplete list history');
      if (
        plan.operation.parents.some(
          parent => !history.some(op => op.id === parent)
        )
      )
        throw new Error(
          'Wait for earlier saved changes to sync before retrying this action'
        );
      const operation: Operation = {
        ...plan.operation,
        commit: {
          sequence: history.filter(op => op.commit).length + 1,
          parents: state.heads,
        },
      };
      const next = replay([...history, operation]);
      if (!next.complete) throw new Error(next.error ?? 'Incomplete commit');
      if (
        requireApplicable &&
        next.conflicts.some(c => c.operation.id === operation.id)
      )
        throw new Error(
          'Items changed on another device. Nothing was moved or deleted; review the list and try again.'
        );
      return { ...plan, operation };
    });
    try {
      const result = await store.write(prepared);
      if (result.status !== 'synced')
        throw new Error(
          'Waiting for the server to confirm this action. Reconnect and retry.'
        );
      return prepared;
    } catch (error) {
      lastError = error;
      // The next complete read also detects an acknowledged-but-lost response.
    }
  }
  throw lastError;
}
