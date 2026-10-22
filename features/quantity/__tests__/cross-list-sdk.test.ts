import { randomUUID as id } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, it, vi } from 'vitest';

import { clientFor } from '../../../scripts/quantity/client.mjs';
import { testApp } from '../../../scripts/quantity/test-app.mjs';
import {
  commitOperations,
  decodeHistory,
  serialKey,
  type CommitStore,
} from '../commits';
import { buildCrossListMove } from '../cross-list-move';
import { materialize, records, totalFor } from '../model';
import { deleteRecipeContributions } from '../recipe-deletion';
import { extraQuantity, manualAdd } from '../shopping';
import { QuantityTransaction } from '../transaction';

it.skipIf(process.env.RUN_QUANTITY_SDK !== '1')(
  'serializes real SDK list races and atomically rejects partial moves and recipe deletes',
  async () => {
    const { db: admin } = testApp();
    vi.stubGlobal('window', {});
    vi.stubGlobal('BroadcastChannel', undefined);
    const logs = ['warn', 'log', 'error'].map(method =>
      vi.spyOn(console, method as 'log').mockImplementation(() => {})
    );
    const users = [id(), id()];
    const lists = [id(), id()];
    const shares = lists.flatMap(() => users.map(() => id()));
    const recipeId = id();
    const clients: Awaited<ReturnType<typeof clientFor>>[] = [];
    const findings: string[] = [];
    let stage = 'initialize';
    try {
      await admin.transact([
        ...users.map(user =>
          admin.tx.$users[user].update({ hasInitializedGroceryList: false })
        ),
        ...lists.flatMap((list, index) => [
          admin.tx.grocery_lists[list]
            .update({
              name: 'Serial SDK test',
              ownerId: users[0],
              joinCode: id(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .link({ owner: users[0] }),
          ...users.map((user, member) =>
            admin.tx.grocery_list_shares[shares[index * 2 + member]]
              .update({ grocery_list_id: list, user_id: user })
              .link({ grocery_list: list })
          ),
          admin.tx.gqc_workspaces_v1[list]
            .update({
              name: 'Serial test',
              ownerId: users[0],
              memberIds: users,
              appListId: list,
            })
            .link({ groceryList: list }),
        ]),
        admin.tx.recipes[recipeId]
          .update({
            name: 'SDK recipe',
            description: '',
            imageSrc: '',
            visibility: 'private',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .link({ user: users[0] }),
      ]);
      clients.push(await clientFor(admin, users[0], lists[0]));
      clients.push(await clientFor(admin, users[1], lists[0]));
      const storeFor = (index: number, deleteRecipe = false): CommitStore => ({
        read: async workspaceId =>
          (
            await clients[index].client.queryOnce(
              {
                gqc_operations_v1: { $: { where: { workspaceId } } },
              },
              { ruleParams: { commitRead: id() } }
            )
          ).data.gqc_operations_v1,
        write: plans =>
          clients[index].client.transact([
            ...plans.map(p =>
              clients[index].client.tx.gqc_operations_v1[p.operation.id]
                .update({
                  workspaceId: p.workspaceId,
                  authorId: users[index],
                  serialKey: serialKey(p.workspaceId, p.operation),
                  body: JSON.stringify(p.operation),
                })
                .link({ workspace: p.workspaceId })
            ),
            ...(deleteRecipe
              ? [clients[index].client.tx.recipes[recipeId].delete()]
              : []),
          ]),
      });
      const owner = storeFor(0),
        member = storeFor(1);
      const read = async (list: string) =>
        materialize(decodeHistory(await owner.read(list)));
      for (const list of lists) {
        const tx = new QuantityTransaction(materialize([]));
        tx.put({ kind: 'list', id: list, name: 'SDK list' });
        await commitOperations(
          owner,
          [{ workspaceId: list, operation: tx.build(id(), 'Initialize') }],
          users[0],
          true
        );
      }
      stage = 'reject unsequenced writers and foreign slot claims';
      for (const key of [undefined, `${lists[1]}:1000`]) {
        await expect(
          clients[0].client.transact(
            clients[0].client.tx.gqc_operations_v1[id()]
              .update({
                workspaceId: lists[0],
                authorId: users[0],
                body: '{}',
                ...(key ? { serialKey: key } : {}),
              })
              .link({ workspace: lists[0] })
          )
        ).rejects.toBeDefined();
      }
      findings.push(
        'Permissions reject unsequenced app writers and attempts to reserve another list’s slot.'
      );
      await commitOperations(
        owner,
        [
          {
            workspaceId: lists[0],
            operation: manualAdd(await read(lists[0]), id, lists[0], {
              id: id(),
              name: 'Apples',
              quantity: 2,
              unit: 'each',
              notes: '',
              category: '',
              store: '',
            }),
          },
        ],
        users[0],
        true
      );
      const row = records(await read(lists[0]), 'row')[0];
      const move = buildCrossListMove(
        await read(lists[0]),
        await read(lists[1]),
        [row.id],
        lists[1],
        id
      );
      let race = true;
      const racing: CommitStore = {
        ...owner,
        write: async plans => {
          if (race) {
            race = false;
            await commitOperations(
              member,
              [
                {
                  workspaceId: lists[0],
                  operation: extraQuantity(await read(lists[0]), id, row.id, 3),
                },
              ],
              users[1],
              true
            );
          }
          return owner.write(plans);
        },
      };
      stage = 'source add versus atomic move';
      await expect(
        commitOperations(racing, move, users[0], true)
      ).rejects.toThrow('Nothing was moved or deleted');
      expect(totalFor(await read(lists[0]), row.id)).toBe(5);
      expect(records(await read(lists[1]), 'row')).toHaveLength(0);
      findings.push(
        'A real unique-slot collision rejects both move halves; concurrent source add survives.'
      );
      stage = 'membership revocation during move';
      const revokedMove = buildCrossListMove(
        await read(lists[0]),
        await read(lists[1]),
        [row.id],
        lists[1],
        id
      );
      let revoke = true;
      const revokedStore: CommitStore = {
        ...owner,
        write: async plans => {
          if (revoke) {
            revoke = false;
            await admin.transact(
              admin.tx.grocery_list_shares[shares[2]].delete()
            );
          }
          return owner.write(plans);
        },
      };
      await expect(
        commitOperations(revokedStore, revokedMove, users[0], true)
      ).rejects.toBeDefined();
      expect((await read(lists[0])).documents[row.id]).toMatchObject({
        status: 'active',
      });
      const deniedTarget = await admin.query({
        gqc_operations_v1: { $: { where: { workspaceId: lists[1] } } },
      });
      expect(deniedTarget.gqc_operations_v1).toHaveLength(1);
      await admin.transact(
        admin.tx.grocery_list_shares[shares[2]]
          .update({
            grocery_list_id: lists[1],
            user_id: users[0],
          })
          .link({ grocery_list: lists[1] })
      );
      findings.push(
        'Destination membership revocation rejects the entire move without removing the source.'
      );
      stage = 'successful move followed by stale offline intent';
      const stale = extraQuantity(await read(lists[0]), id, row.id, 1);
      const nextMove = buildCrossListMove(
        await read(lists[0]),
        await read(lists[1]),
        [row.id],
        lists[1],
        id
      );
      await commitOperations(owner, nextMove, users[0], true);
      await commitOperations(
        member,
        [{ workspaceId: lists[0], operation: stale }],
        users[1]
      );
      expect(
        (await read(lists[0])).conflicts.some(c => c.operation.id === stale.id)
      ).toBe(true);
      const destination = await read(lists[1]);
      expect(totalFor(destination, records(destination, 'row')[0].id)).toBe(5);
      findings.push(
        'An accepted move remains stable when a stale intent arrives; the stale edit is a visible conflict.'
      );
      stage = 'recipe deletion versus new planned source';
      const deletions = await Promise.all(
        lists.map(async list => ({
          workspaceId: list,
          operation: deleteRecipeContributions(
            await read(list),
            id,
            recipeId,
            'SDK recipe'
          ),
        }))
      );
      const deletionStore = storeFor(0, true);
      race = true;
      const racingDelete: CommitStore = {
        ...deletionStore,
        write: async plans => {
          if (race) {
            race = false;
            const tx = new QuantityTransaction(await read(lists[0]));
            tx.put({
              kind: 'recipe',
              id: recipeId,
              name: 'SDK recipe',
              ingredients: [],
            });
            tx.put({
              kind: 'meal',
              id: id(),
              listId: lists[0],
              recipeId,
              name: 'SDK meal',
              date: '2026-10-20',
              mealTag: '',
              servings: 1,
              ingredients: [],
            });
            await commitOperations(
              member,
              [
                {
                  workspaceId: lists[0],
                  operation: tx.build(id(), 'Plan meal'),
                },
              ],
              users[1],
              true
            );
          }
          return deletionStore.write(plans);
        },
      };
      await expect(
        commitOperations(racingDelete, deletions, users[0], true)
      ).rejects.toThrow('Nothing was moved or deleted');
      expect(
        (await admin.query({ recipes: { $: { where: { id: recipeId } } } }))
          .recipes
      ).toHaveLength(1);
      expect((await read(lists[1])).documents[recipeId]).toBeUndefined();
      findings.push(
        'A racing planned source prevents catalog deletion and every list-side deletion.'
      );
      const retry = await Promise.all(
        lists.map(async list => ({
          workspaceId: list,
          operation: deleteRecipeContributions(
            await read(list),
            id,
            recipeId,
            'SDK recipe'
          ),
        }))
      );
      await commitOperations(deletionStore, retry, users[0], true);
      expect(
        (await admin.query({ recipes: { $: { where: { id: recipeId } } } }))
          .recipes
      ).toHaveLength(0);
      for (const list of lists) {
        expect(records(await read(list), 'meal')).toHaveLength(0);
        expect((await read(list)).documents[recipeId]).toMatchObject({
          deleted: true,
        });
      }
      findings.push(
        'Retry commits catalog deletion and all list tombstones atomically.'
      );
      mkdirSync('tmp/quantity-tests', { recursive: true });
      writeFileSync(
        'tmp/quantity-tests/cross-list-sdk.json',
        JSON.stringify(
          {
            time: new Date().toISOString(),
            findings,
            productionEnabled: false,
          },
          null,
          2
        ) + '\n'
      );
    } catch (error) {
      throw new Error(
        `${stage}: ${String(error)} ${JSON.stringify(clients.flatMap(c => c.diagnostics))}`
      );
    } finally {
      clients.forEach(client => client.reactor.shutdown());
      const data = await admin.query({
        gqc_operations_v1: { $: { where: { workspaceId: { $in: lists } } } },
      });
      await admin.transact([
        ...data.gqc_operations_v1.map((op: { id: string }) =>
          admin.tx.gqc_operations_v1[op.id].delete()
        ),
        ...lists.map(list => admin.tx.gqc_workspaces_v1[list].delete()),
        ...shares.map(share => admin.tx.grocery_list_shares[share].delete()),
        ...lists.map(list => admin.tx.grocery_lists[list].delete()),
        admin.tx.recipes[recipeId].delete(),
        ...users.map(user => admin.tx.$users[user].delete()),
      ]);
      logs.forEach(log => log.mockRestore());
      vi.unstubAllGlobals();
    }
  },
  120000
);
