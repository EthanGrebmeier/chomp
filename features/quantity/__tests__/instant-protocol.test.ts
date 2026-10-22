import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

import { clientFor, until } from '../../../scripts/quantity/client.mjs';
import { names, testApp } from '../../../scripts/quantity/test-app.mjs';
import { initialOperations } from '../fixtures';
import { editMealIngredient } from '../meals';
import { materialize, records, totalFor } from '../model';
import {
  checkRow,
  deleteRows,
  editQuantity,
  extraQuantity,
  moveRow,
} from '../shopping';
import type { Operation } from '../types';

describe('allowlisted InstantDB protocol', () => {
  it.skipIf(process.env.RUN_QUANTITY_SDK !== '1')(
    'persists immutable intents, conflicts, permissions, complete reads and offline replay',
    async () => {
      const { db } = testApp();
      const users = [randomUUID(), randomUUID(), randomUUID()];
      const workspaceId = randomUUID();
      const foreignWorkspace = randomUUID();
      const clients: Awaited<ReturnType<typeof clientFor>>[] = [];
      const findings: string[] = [];
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      // Core requires a browser-like runtime for authenticated WebSocket clients.
      vi.stubGlobal('window', {});
      vi.stubGlobal('BroadcastChannel', undefined);
      const query = {
        [names.workspaces]: { $: { where: { id: workspaceId } } },
        [names.operations]: { $: { where: { workspaceId } } },
      };
      const chunks = (
        client: ReturnType<typeof clientFor> extends Promise<infer T>
          ? T
          : never,
        operation: Operation,
        authorId: string
      ) =>
        client.client.tx[names.operations][operation.id]
          .update({ workspaceId, authorId, body: JSON.stringify(operation) })
          .link({ workspace: workspaceId });
      const read = async () => {
        const result = await db.query(query);
        return result[names.operations].map(
          (r: { body: string }) => JSON.parse(r.body) as Operation
        );
      };
      const synced = async (
        promise: Promise<{ status: string }>,
        name: string
      ) => {
        let status;
        try {
          status = (await promise).status;
        } catch {
          status = 'rejected';
        }
        if (status !== 'synced')
          throw new Error(
            `${name}: ${JSON.stringify(clients.flatMap(c => c.diagnostics).map(d => ({ type: d.type, message: d.message, hint: d.hint })))}`
          );
        expect(status, name).toBe('synced');
        findings.push(name);
      };
      const denied = async (
        client: Awaited<ReturnType<typeof clientFor>>,
        tx: unknown,
        name: string
      ) => {
        const before = client.errors.length;
        let rejected = false;
        try {
          await client.client.transact(tx);
        } catch {
          rejected = true;
        }
        expect(rejected, name).toBe(true);
        expect(client.errors.slice(before), name).toContain(
          'permission-denied'
        );
        findings.push(name);
      };
      try {
        await db.transact(
          users.map((userId, index) =>
            db.tx.$users[userId].update({
              email: `quantity-${index}-${userId}@example.invalid`,
            })
          )
        );
        for (const user of users)
          clients.push(await clientFor(db, user, workspaceId));
        const [alice, bob, outsider] = clients;
        const seed = initialOperations(randomUUID);
        await synced(
          alice.client.transact([
            alice.client.tx[names.workspaces][workspaceId].update({
              name: 'SDK quantity proof',
              ownerId: users[0],
              memberIds: [users[0]],
            }),
            ...seed.map(op => chunks(alice, op, users[0])),
          ]),
          'owner creates workspace and initial operation graph atomically'
        );
        await synced(
          alice.client.transact(
            alice.client.tx[names.workspaces][workspaceId].update({
              memberIds: [users[0], users[1]],
            })
          ),
          'owner shares workspace'
        );
        const initial = materialize(await read());
        const row = records(initial, 'row').find(r => r.unit === 'each')!;
        const a = extraQuantity(initial, randomUUID, row.id, 1);
        const b = extraQuantity(initial, randomUUID, row.id, 2);
        await Promise.all([
          synced(
            alice.client.transact(chunks(alice, a, users[0])),
            'owner adds independent quantity'
          ),
          synced(
            bob.client.transact(chunks(bob, b, users[1])),
            'member adds concurrent independent quantity'
          ),
        ]);
        expect(totalFor(materialize(await read()), row.id)).toBe(8);
        await denied(
          alice,
          alice.client.tx[names.operations][a.id].update({
            workspaceId,
            authorId: users[0],
            body: JSON.stringify(a),
          }),
          'even exact payload rewrites are denied; retries recognize the stored intent'
        );
        const retry = await alice.client.queryOnce(
          { [names.operations]: { $: { where: { id: a.id } } } },
          { ruleParams: { fresh: randomUUID() } }
        );
        expect(retry.data[names.operations][0].body).toBe(JSON.stringify(a));
        expect(totalFor(materialize(await read()), row.id)).toBe(8);
        findings.push(
          'ambiguous retry recognizes exact saved payload without double counting'
        );
        await denied(
          alice,
          chunks(alice, { ...a, label: 'Tampered operation' }, users[0]),
          'same-ID changed payload is rejected'
        );
        await denied(
          bob,
          chunks(bob, a, users[0]),
          'another member cannot overwrite author intent'
        );
        await denied(
          alice,
          alice.client.tx[names.operations][a.id].delete(),
          'operation deletion is rejected'
        );
        await denied(
          outsider,
          chunks(
            outsider,
            extraQuantity(initial, randomUUID, row.id, 100),
            users[2]
          ),
          'outsider cannot write workspace'
        );
        await denied(
          bob,
          bob.client.tx[names.workspaces][workspaceId].update({
            ownerId: users[1],
          }),
          'member cannot seize ownership'
        );
        const deniedRead = await outsider.client.queryOnce(query, {
          ruleParams: { fresh: randomUUID() },
        });
        expect(deniedRead.data[names.operations]).toEqual([]);
        findings.push('outsider cannot read operations');
        await synced(
          alice.client.transact(
            alice.client.tx[names.workspaces][foreignWorkspace].update({
              name: 'Separate scope',
              ownerId: users[0],
              memberIds: [users[0]],
            })
          ),
          'create separate permission scope'
        );
        await denied(
          bob,
          bob.client.tx[names.operations][randomUUID()]
            .update({
              workspaceId,
              authorId: users[1],
              body: JSON.stringify(a),
            })
            .link({ workspace: foreignWorkspace }),
          'cross-workspace mismatched scope is rejected'
        );
        await denied(
          alice,
          alice.client.tx[names.operations][a.id].link({
            workspace: foreignWorkspace,
          }),
          'existing intent cannot be relinked'
        );
        await denied(
          alice,
          alice.client.tx[names.operations][a.id].unlink({
            workspace: workspaceId,
          }),
          'existing intent cannot be unlinked'
        );
        await denied(
          alice,
          alice.client.tx[names.workspaces][workspaceId].unlink({
            operations: a.id,
          }),
          'reverse relationship cannot hide an intent'
        );
        await denied(
          alice,
          alice.client.tx[names.workspaces][foreignWorkspace].link({
            operations: a.id,
          }),
          'reverse relationship cannot move an intent'
        );
        let state = materialize(await read());
        const entry = records(state, 'entry').find(
          e => e.origin === 'manual' && e.rowId === row.id
        )!;
        const editA = editQuantity(state, randomUUID, entry.id, 7);
        const editB = editQuantity(state, randomUUID, entry.id, 9);
        await Promise.all([
          synced(
            alice.client.transact(chunks(alice, editA, users[0])),
            'owner edit retained'
          ),
          synced(
            bob.client.transact(chunks(bob, editB, users[1])),
            'member concurrent same-entry edit retained'
          ),
        ]);
        state = materialize(await read());
        expect(state.conflicts).toHaveLength(1);
        expect(state.conflicts[0].operation.id).toBe(
          [editA.id, editB.id].sort()[1]
        );
        const complete = await bob.client.queryOnce(query, {
          ruleParams: { fresh: randomUUID() },
        });
        expect(complete.data[names.operations].length).toBe(
          (await read()).length
        );
        expect(
          materialize(
            complete.data[names.operations].map((r: { body: string }) =>
              JSON.parse(r.body)
            )
          )
        ).toEqual(state);
        findings.push(
          'unpaginated member read matches full admin operation set and derived state'
        );
        const meal = records(state, 'meal')[0];
        const planned = editMealIngredient(
          state,
          randomUUID,
          meal.id,
          meal.ingredients[0].id,
          { quantity: 4 }
        );
        const manual = extraQuantity(state, randomUUID, row.id, 0.5);
        await Promise.all([
          synced(
            alice.client.transact(chunks(alice, planned, users[0])),
            'source edit is atomic'
          ),
          synced(
            bob.client.transact(chunks(bob, manual, users[1])),
            'manual add survives source sync'
          ),
        ]);
        state = materialize(await read());
        const queued = extraQuantity(state, randomUUID, row.id, 0.25);
        bob.setOnline(false);
        await until(() => !bob.isConnected(), 'client offline');
        let offlineQueryRejected = false;
        try {
          await bob.client.queryOnce(query);
        } catch {
          offlineQueryRejected = true;
        }
        expect(offlineQueryRejected).toBe(true);
        const queuedResult = await bob.client.transact(
          chunks(bob, queued, users[1])
        );
        expect(queuedResult.status).toBe('enqueued');
        expect((await read()).some(op => op.id === queued.id)).toBe(false);
        bob.setOnline(true);
        await until(
          async () => (await read()).some(op => op.id === queued.id),
          'offline replay'
        );
        findings.push(
          'offline operation queues once, survives reconnect and is server-persisted'
        );
        state = materialize(await read());
        const purchase = checkRow(state, randomUUID, row.id);
        await synced(
          alice.client.transact(chunks(alice, purchase, users[0])),
          'purchase freezes complete quantity set'
        );
        state = materialize(await read());
        const purchasedTotal = totalFor(state, row.id);
        const updatePurchasedSource = editMealIngredient(
          state,
          randomUUID,
          meal.id,
          meal.ingredients[0].id,
          { quantity: 50 }
        );
        await synced(
          bob.client.transact(chunks(bob, updatePurchasedSource, users[1])),
          'source edit after purchase'
        );
        state = materialize(await read());
        expect(totalFor(state, row.id)).toBe(purchasedTotal);
        const clear = deleteRows(state, randomUUID, [row.id]);
        await synced(
          alice.client.transact(chunks(alice, clear, users[0])),
          'clear history without source deselection'
        );
        state = materialize(await read());
        const grams = records(state, 'row').find(r => r.unit === 'g')!;
        const otherList = records(state, 'list').find(
          l => l.id !== grams.listId
        )!;
        await synced(
          bob.client.transact(
            chunks(
              bob,
              moveRow(state, randomUUID, grams.id, otherList.id),
              users[1]
            )
          ),
          'move is one atomic persisted operation'
        );
        await synced(
          alice.client.transact(
            alice.client.tx[names.workspaces][workspaceId].update({
              memberIds: [users[0]],
            })
          ),
          'owner revokes member'
        );
        await denied(
          bob,
          chunks(bob, extraQuantity(initial, randomUUID, row.id, 1), users[1]),
          'revoked member cannot replay a stale write'
        );
        const revoked = await bob.client.queryOnce(query, {
          ruleParams: { fresh: randomUUID() },
        });
        expect(revoked.data[names.operations]).toEqual([]);
        findings.push('revoked member loses complete operation read');
        mkdirSync('tmp/quantity-tests', {
          recursive: true,
        });
        writeFileSync(
          'tmp/quantity-tests/quantity-workspace-sdk.json',
          JSON.stringify(
            {
              time: new Date().toISOString(),
              findings,
              nativeRestartVerified: false,
              productionEnabled: false,
            },
            null,
            2
          ) + '\n'
        );
      } finally {
        for (const client of clients) client.client.shutdown();
        const data = await db.query(query);
        await db.transact([
          ...data[names.operations].map((op: { id: string }) =>
            db.tx[names.operations][op.id].delete()
          ),
          db.tx[names.workspaces][workspaceId].delete(),
          db.tx[names.workspaces][foreignWorkspace].delete(),
          ...users.map(user => db.tx.$users[user].delete()),
        ]);
        warn.mockRestore();
        log.mockRestore();
        error.mockRestore();
        vi.unstubAllGlobals();
      }
    },
    120000
  );
});
