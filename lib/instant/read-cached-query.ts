import type { ValidQuery } from '@instantdb/react-native';

import type { AppSchema } from '@/instant.schema';

import { db } from '.';

/** A one-shot subscription can read the SDK's persisted result offline.
 * Use stable query shapes shared with mounted screens. queryOnce always needs
 * a server reply and belongs only in commit/permission verification paths. */
export function readCachedQuery<Q extends ValidQuery<Q, AppSchema>>(query: Q) {
  type Result = Awaited<ReturnType<typeof db.queryOnce<Q>>>;
  return new Promise<Pick<Result, 'data'>>((resolve, reject) => {
    let settled = false;
    let unsubscribe: (() => void) | undefined;
    const timeout = setTimeout(() => {
      finish();
      reject(
        new Error('This data is not downloaded yet. Connect and try again.')
      );
    }, 3000);
    function finish() {
      settled = true;
      clearTimeout(timeout);
      unsubscribe?.();
    }
    try {
      unsubscribe = db.core.subscribeQuery(query, result => {
        if (settled) return;
        if (result.error) {
          finish();
          reject(new Error(result.error.message));
        } else if (result.data) {
          finish();
          resolve({ data: result.data });
        }
      });
      // Cached responses may be delivered synchronously during subscription.
      if (settled) unsubscribe?.();
    } catch (error) {
      finish();
      reject(error);
    }
  });
}
