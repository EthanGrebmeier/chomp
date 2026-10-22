import { id } from '@instantdb/react-native';

import { db } from '@/lib/instant';

import type { CommitStore } from './commits';
import { operationChunk } from './operation-chunk';

export function quantityCommitStore(
  authorId: string,
  extraWrites: Parameters<typeof db.transact>[0] = []
): CommitStore {
  return {
    read: async workspaceId => {
      const { data } = await db.queryOnce(
        {
          gqc_workspaces_v1: { $: { where: { id: workspaceId } } },
          gqc_operations_v1: { $: { where: { workspaceId } } },
        },
        { ruleParams: { quantityCommit: id() } }
      );
      if (data.gqc_workspaces_v1.length !== 1)
        throw new Error('List access is unavailable');
      return data.gqc_operations_v1;
    },
    write: plans =>
      db.transact([
        ...plans.map(p => operationChunk(p.operation, p.workspaceId, authorId)),
        ...(Array.isArray(extraWrites) ? extraWrites : [extraWrites]),
      ]),
  };
}
