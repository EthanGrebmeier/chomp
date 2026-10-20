import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  store: vi.fn(),
  query: vi.fn(),
  ensure: vi.fn(),
  sequence: 0,
}));
vi.mock('react-native', () => ({ Alert: { alert: vi.fn() } }));
vi.mock('@instantdb/react-native', () => ({
  id: () => `action-${++mocks.sequence}`,
}));
vi.mock('@/lib/instant', () => ({
  db: {
    getAuth: async () => ({ id: 'owner' }),
    queryOnce: mocks.query,
    tx: {
      recipes: new Proxy(
        {},
        {
          get: (_target, recipeId) => ({
            delete: () => ({ recipeId }),
          }),
        }
      ),
    },
  },
}));
vi.mock('../instant-commit-store', () => ({
  quantityCommitStore: mocks.store,
}));
vi.mock('../app/initialize', () => ({ ensureQuantityList: mocks.ensure }));

import { moveQuantityRows } from '../app/grocery-actions';
import { deleteQuantityRecipe } from '../app/recipe-actions';
import { emptyListSession, publishListSession } from '../app/session';
import {
  decodeHistory,
  serialKey,
  type CommitPlan,
  type StoredOperation,
} from '../commits';
import { initialOperations } from '../fixtures';
import { entriesFor, materialize, records, totalFor } from '../model';
import { QuantityTransaction } from '../transaction';

let stored: StoredOperation[];
let sourceId: string, targetId: string, rowId: string, recipeId: string;
let catalogDeleted: boolean;
const state = (list: string) =>
  materialize(decodeHistory(stored.filter(r => r.workspaceId === list)));
beforeEach(() => {
  if (sourceId) publishListSession(sourceId, null);
  if (targetId) publishListSession(targetId, null);
  vi.clearAllMocks();
  mocks.sequence = 0;
  catalogDeleted = false;
  let n = 0;
  const history = initialOperations(() => `seed-${++n}`);
  const initial = materialize(history);
  [sourceId, targetId] = records(initial, 'list').map(l => l.id);
  const meal = records(initial, 'meal')[0];
  recipeId = meal.recipeId!;
  rowId = records(initial, 'entry').find(e => e.mealId === meal.id)!.rowId;
  const link = new QuantityTransaction(initial);
  link.put({
    ...(initial.documents[rowId] as Extract<
      (typeof initial.documents)[string],
      { kind: 'row' }
    >),
    savedItemId: 'saved-apples',
  });
  history.push(link.build('saved-link', 'Link saved item'));
  stored = history.map(op => ({
    id: op.id,
    workspaceId: sourceId,
    authorId: 'owner',
    body: JSON.stringify(op),
  }));
  const target = new QuantityTransaction(materialize([]));
  target.put({ kind: 'list', id: targetId, name: 'Destination' });
  const op = target.build('target-initial', 'Initialize');
  stored.push({
    id: op.id,
    workspaceId: targetId,
    authorId: 'owner',
    body: JSON.stringify(op),
  });
  mocks.store.mockImplementation((_author, extra: unknown[] = []) => ({
    read: async (workspaceId: string) =>
      structuredClone(stored.filter(r => r.workspaceId === workspaceId)),
    write: async (plans: CommitPlan[]) => {
      if (
        plans.some(p =>
          stored.some(
            row => row.serialKey === serialKey(p.workspaceId, p.operation)
          )
        )
      )
        throw new Error('Slot collision');
      stored.push(
        ...plans.map(p => ({
          id: p.operation.id,
          workspaceId: p.workspaceId,
          authorId: 'owner',
          body: JSON.stringify(p.operation),
          serialKey: serialKey(p.workspaceId, p.operation),
        }))
      );
      if (extra.length) catalogDeleted = true;
      return { status: 'synced' };
    },
  }));
  mocks.query.mockResolvedValue({
    data: {
      grocery_lists: [{ id: sourceId }, { id: targetId }],
      recipes: [{ id: recipeId, name: 'Apple pie' }],
    },
  });
});
function publish(list: string) {
  publishListSession(list, {
    ...emptyListSession,
    canEdit: true,
    loading: false,
    connection: 'authenticated',
    state: state(list),
    refresh: async () => {},
  });
}
it('moves the actual app’s mixed row with independent amounts, saved link and source deselection', async () => {
  publish(sourceId);
  publish(targetId);
  await moveQuantityRows([rowId], targetId);
  expect(state(sourceId).documents[rowId]).toMatchObject({ status: 'deleted' });
  expect(records(state(sourceId), 'meal')[0].ingredients[0].selected).toBe(
    false
  );
  const destination = state(targetId);
  const moved = records(destination, 'row')[0];
  expect(moved.savedItemId).toBe('saved-apples');
  expect(totalFor(destination, moved.id)).toBe(5);
  expect(entriesFor(destination, moved.id)).toHaveLength(3);
  expect(
    entriesFor(destination, moved.id).every(
      e => e.sourceId === null && e.mealId === null
    )
  ).toBe(true);
  expect(
    entriesFor(destination, moved.id).find(e => e.origin === 'recipe')
  ).toMatchObject({ sourceName: 'Apple butter', quantity: 1 });
});
it('deletes a recipe using database list inventory even when no list is mounted', async () => {
  await deleteQuantityRecipe(recipeId);
  expect(mocks.ensure.mock.calls).toEqual([
    [sourceId, 'owner'],
    [targetId, 'owner'],
  ]);
  expect(catalogDeleted).toBe(true);
  for (const list of [sourceId, targetId])
    expect(state(list).documents[recipeId]).toMatchObject({ deleted: true });
  expect(totalFor(state(sourceId), rowId)).toBe(3);
  expect(
    records(state(sourceId), 'meal').filter(m => m.recipeId === recipeId)
  ).toEqual([]);
});
