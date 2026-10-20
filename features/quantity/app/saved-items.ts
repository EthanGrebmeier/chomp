import { id } from '@instantdb/react-native';

import { db } from '@/lib/instant';

import { materialize } from '../model';
import type { Operation, ShoppingRow } from '../types';

const metadataFields = ['name', 'notes', 'category', 'store'] as const;

/**
 * Runs from the durable outbox after the quantity operation reaches the server.
 * Read the accepted graph before syncing: conflicted intents must not change
 * saved items, and retries must never copy an obsolete row over newer edits.
 */
export async function syncQuantitySavedItems(
  operation: Operation,
  workspaceId: string
) {
  if (!operation.syncSavedItems) return;
  const changes = operation.changes.filter(c => c.value?.kind === 'row');
  if (!changes.length) return;
  const result = await db.queryOnce(
    { gqc_operations_v1: { $: { where: { workspaceId } } } },
    { ruleParams: { savedItemSync: id() } }
  );
  const operations = result.data.gqc_operations_v1.map(
    row => JSON.parse(row.body) as Operation
  );
  const state = materialize(operations);
  if (!state.complete || !operations.some(op => op.id === operation.id))
    throw new Error(
      'Wait for the complete quantity history before syncing saved items'
    );
  if (state.conflicts.some(c => c.operation.id === operation.id)) return;
  for (const change of changes) {
    const edited = change.value as ShoppingRow;
    const row = state.documents[change.id];
    if (row?.kind !== 'row' || edited.status !== 'active') continue;
    if (row.savedItemId !== edited.savedItemId) continue;
    const previous = operations
      .find(op => op.id === change.before)
      ?.changes.find(c => c.id === change.id)?.value;
    const before = previous?.kind === 'row' ? previous : undefined;
    const linked = !!row.savedItemId && row.savedItemId !== before?.savedItemId;
    const fields = metadataFields.filter(
      field => linked || before?.[field] !== edited[field]
    );
    if (!fields.length) continue;
    if (!row.savedItemId) {
      // Initial manual adds already write recent-item history at their entrypoint.
      if (!before) continue;
      const { upsertLocalSavedItem } =
        await import('@/features/saved-items/local/upsert-local-saved-item');
      await upsertLocalSavedItem({
        item: {
          name: row.name,
          notes: row.notes,
          category: row.category,
          storeId: row.store || undefined,
        },
        matchName: before.name,
      });
      continue;
    }
    const user = await db.getAuth();
    if (!user) throw new Error('Sign in before syncing saved items');
    const savedResult = await db.queryOnce({
      saved_items: {
        $: { where: { id: row.savedItemId } },
        user: {},
        store: {},
      },
    });
    const saved = savedResult.data.saved_items[0];
    // Never recreate deleted items or change a collaborator's saved defaults.
    if (!saved || saved.user?.id !== user.id) continue;
    const patch: { name?: string; notes?: string; category?: string } = {};
    for (const field of fields) {
      if (field !== 'store' && row[field] !== (saved[field] ?? ''))
        patch[field] = row[field];
    }
    const writes: Parameters<typeof db.transact>[0] = [];
    if (Object.keys(patch).length)
      writes.push(
        db.tx.saved_items[saved.id].update({
          ...patch,
          updatedAt: new Date().toISOString(),
        })
      );
    if (fields.includes('store') && row.store !== (saved.store?.id ?? '')) {
      if (saved.store)
        writes.push(
          db.tx.saved_items[saved.id].unlink({ store: saved.store.id })
        );
      if (row.store)
        writes.push(db.tx.saved_items[saved.id].link({ store: row.store }));
    }
    if (writes.length) {
      const response = await db.transact(writes);
      if (response.status !== 'synced')
        throw new Error('Saved-item changes are waiting for a connection');
    }
  }
}
