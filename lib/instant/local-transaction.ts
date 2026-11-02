import { db } from '.';

/**
 * Instant applies transactions optimistically, but its promise represents server
 * acknowledgement (or enqueueing offline), not disk persistence. Keep this SDK
 * integration here: callers must never implement fire-and-forget saves.
 *
 * This deliberately does not change db.transact: atomic cross-list commits,
 * permissions, migrations, and sync workers still require server confirmation.
 */
export async function transactLocally(
  chunks: Parameters<typeof db.transact>[0]
): Promise<void> {
  const user = await db.getAuth();
  if (!user) throw new Error('Sign in before saving changes');
  await writeLocally(chunks, user.id);
}

// Serialize only local persistence, never the network acknowledgement. In
// particular, a second edit must not be blocked behind a hanging connection.
let pendingSave: Promise<unknown> = Promise.resolve();
function writeLocally(
  chunks: Parameters<typeof db.transact>[0],
  userId: string
) {
  const save = pendingSave
    .catch(() => undefined)
    .then(async () => {
      const reactor = db.core._reactor;
      const kv = reactor.kv;
      if (!(await kv.waitForMetaToLoad())) {
        throw new Error('Could not open local storage. Please try again.');
      }
      await kv.waitForKeyToLoad('pendingMutations');
      // Recheck after loading disk state so an account switch cannot apply this
      // user's queued form to the next account.
      if ((await db.getAuth())?.id !== userId) {
        throw new Error('Account changed. Please try again.');
      }

      let failed = false;
      let failure: unknown;
      // The global mutation-error subscription also covers errors after restart
      // and errors for transactions whose promise already resolved as enqueued.
      void db.transact(chunks).catch(error => {
        failed = true;
        failure = error;
      });
      // Force the current queue dirty, including after a failed
      // disk write (the SDK removes dirty keys before awaiting storage). Cloning
      // the map avoids relying on the SDK's background persistence timer.
      kv.updateInPlace(previous => {
        previous.pendingMutations = new Map(previous.pendingMutations ?? []);
      });
      await kv.flush();
      await reactor.querySubs.flush();
      if (failed) throw failure;
      if ((await db.getAuth())?.id !== userId) {
        throw new Error('Account changed. Please try again.');
      }
    });
  pendingSave = save;
  return save;
}
