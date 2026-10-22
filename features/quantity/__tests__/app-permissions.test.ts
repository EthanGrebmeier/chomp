import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { clientFor } from '../../../scripts/quantity/client.mjs';
import { testApp } from '../../../scripts/quantity/test-app.mjs';
import { materialize, totalFor } from '../model';
import { manualAdd, extraQuantity } from '../shopping';
import { QuantityTransaction } from '../transaction';
import type { Operation } from '../types';

describe('real grocery-list quantity permissions', () => {
  it.skipIf(process.env.RUN_QUANTITY_SDK !== '1')(
    'uses live guest list membership and keeps list scopes immutable',
    async () => {
      const { db: admin } = testApp();
      vi.stubGlobal('window', {});
      vi.stubGlobal('BroadcastChannel', undefined);
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const users = [randomUUID(), randomUUID()];
      const listId = randomUUID(),
        shareId = randomUUID(),
        secondShareId = randomUUID();
      const clients: Awaited<ReturnType<typeof clientFor>>[] = [];
      const joinCode = randomUUID().slice(0, 8);
      let stage = 'create guest users';
      const query = {
        gqc_operations_v1: { $: { where: { workspaceId: listId } } },
      };
      try {
        await admin.transact(
          users.map(userId =>
            admin.tx.$users[userId].update({ hasInitializedGroceryList: false })
          )
        );
        const guest = await clientFor(admin, users[0], listId);
        const other = await clientFor(admin, users[1], listId);
        clients.push(guest, other);
        expect((await guest.client.getAuth())?.email).toBeFalsy();
        const now = new Date().toISOString();
        stage = 'create real list';
        await guest.client.transact([
          guest.client.tx.grocery_lists[listId]
            .update({
              name: 'SDK real guest list',
              ownerId: users[0],
              joinCode,
              createdAt: now,
              updatedAt: now,
            })
            .link({ owner: users[0] }),
          guest.client.tx.grocery_list_shares[shareId]
            .update({ grocery_list_id: listId, user_id: users[0] })
            .link({ grocery_list: listId }),
        ]);
        const tx = new QuantityTransaction(materialize([]));
        tx.put({ kind: 'list', id: listId, name: 'SDK real guest list' });
        const genesis: Operation = tx.build(
          randomUUID(),
          'Initialize guest list'
        );
        let sequence = 0;
        const chunk = (client: typeof guest, operation: typeof genesis) => {
          operation.commit = {
            sequence: ++sequence,
            parents: operation.parents,
          };
          return client.client.tx.gqc_operations_v1[operation.id]
            .update({
              workspaceId: listId,
              authorId: client === guest ? users[0] : users[1],
              serialKey: `${listId}:${operation.commit.sequence}`,
              body: JSON.stringify(operation),
            })
            .link({ workspace: listId });
        };
        stage = 'initialize list quantity scope';
        expect(
          (
            await guest.client.transact([
              guest.client.tx.gqc_workspaces_v1[listId]
                .update({
                  name: 'SDK real guest list',
                  ownerId: users[0],
                  memberIds: [users[0]],
                  appListId: listId,
                })
                .link({ groceryList: listId }),
              chunk(guest, genesis),
            ])
          ).status
        ).toBe('synced');
        const added = manualAdd(materialize([genesis]), randomUUID, listId, {
          id: randomUUID(),
          name: 'Apples',
          quantity: 2,
          unit: 'each',
          notes: '',
          category: '',
          store: '',
        });
        await guest.client.transact(chunk(guest, added));
        expect(
          (await other.client.queryOnce(query)).data.gqc_operations_v1
        ).toEqual([]);
        await expect(
          guest.client.transact(
            guest.client.tx.gqc_workspaces_v1[listId].unlink({
              groceryList: listId,
            })
          )
        ).rejects.toBeDefined();
        await expect(
          guest.client.transact(
            guest.client.tx.gqc_workspaces_v1[listId].update({
              appListId: null,
            })
          )
        ).rejects.toBeDefined();
        stage = 'join by code';
        await other.client.transact([
          other.client.tx.grocery_list_shares[secondShareId]
            .update({ grocery_list_id: listId, user_id: users[1] })
            .link({ grocery_list: listId }),
          other.client.tx.grocery_lists[listId].ruleParams({
            knownJoinCode: joinCode,
          }),
        ]);
        const visible = await other.client.queryOnce(query, {
          ruleParams: { testRead: randomUUID() },
        });
        expect(visible.data.gqc_operations_v1).toHaveLength(2);
        const state = materialize([genesis, added]);
        const row = added.changes.find(c => c.value?.kind === 'row')!.id;
        const combined = extraQuantity(state, randomUUID, row, 3);
        stage = 'shared member adds contribution';
        await other.client.transact(chunk(other, combined));
        expect(totalFor(materialize([genesis, added, combined]), row)).toBe(5);
        stage = 'leave real list';
        await other.client.transact(
          other.client.tx.grocery_list_shares[secondShareId].delete()
        );
        const revoked = await other.client.queryOnce(query, {
          ruleParams: { testRead: randomUUID() },
        });
        expect(revoked.data.gqc_operations_v1).toEqual([]);
        await expect(
          other.client.transact(
            chunk(
              other,
              extraQuantity(
                materialize([genesis, added, combined]),
                randomUUID,
                row,
                1
              )
            )
          )
        ).rejects.toBeDefined();
        const persisted = await admin.query(query);
        expect(persisted.gqc_operations_v1).toHaveLength(3);
      } catch (failure) {
        throw new Error(
          `${stage}: ${String(failure)} ${JSON.stringify(clients.flatMap(c => c.diagnostics))}`
        );
      } finally {
        for (const client of clients) client.reactor.shutdown();
        const operations = await admin.query(query);
        await admin.transact([
          ...operations.gqc_operations_v1.map((op: { id: string }) =>
            admin.tx.gqc_operations_v1[op.id].delete()
          ),
          admin.tx.gqc_workspaces_v1[listId].delete(),
          admin.tx.grocery_list_shares[shareId].delete(),
          admin.tx.grocery_list_shares[secondShareId].delete(),
          admin.tx.grocery_lists[listId].delete(),
          ...users.map(userId => admin.tx.$users[userId].delete()),
        ]);
        warn.mockRestore();
        log.mockRestore();
        error.mockRestore();
        vi.unstubAllGlobals();
      }
    },
    60000
  );
});
