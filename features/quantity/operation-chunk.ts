import { db } from '@/lib/instant';

import { serialKey } from './commits';
import type { Operation } from './types';

export const operationChunk = (
  operation: Operation,
  workspaceId: string,
  authorId: string
) =>
  db.tx.gqc_operations_v1[operation.id]
    .update({
      workspaceId,
      authorId,
      body: JSON.stringify(operation),
      ...(operation.commit
        ? { serialKey: serialKey(workspaceId, operation) }
        : {}),
    })
    .link({ workspace: workspaceId });
