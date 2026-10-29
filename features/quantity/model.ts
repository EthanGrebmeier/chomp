import type { Document, Operation, QuantityState, Versioned } from './types';
import { assertDocument, assertOperation } from './validation';

export const normalize = (value: string) =>
  value.trim().toLocaleLowerCase('en-US').replace(/\s+/g, ' ');
export const validQuantity = (value: number) =>
  Number.isFinite(value) && value >= 0 && value <= 1e12;
export const parseQuantity = (value: string): number | null => {
  const normalized = value.trim().replace(',', '.');
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return null;
  const amount = Number(normalized);
  return validQuantity(amount) ? amount : null;
};
const quantityFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 6,
});
export const formatQuantity = (value: number) =>
  quantityFormatter.format(value);
export const records = <K extends Document['kind']>(
  state: QuantityState,
  kind: K
) =>
  Object.values(state.documents).filter(
    (value): value is Versioned<Extract<Document, { kind: K }>> =>
      value.kind === kind
  );
export function record<K extends Document['kind']>(
  state: QuantityState,
  id: string,
  kind: K
): Versioned<Extract<Document, { kind: K }>> {
  const value = state.documents[id];
  if (value?.kind !== kind) throw new Error(`${kind} is no longer available`);
  return value as Versioned<Extract<Document, { kind: K }>>;
}
export const entriesFor = (state: QuantityState, rowId: string) =>
  records(state, 'entry').filter(entry => entry.rowId === rowId);
export const entryVersions = (state: QuantityState, rowId: string) =>
  entriesFor(state, rowId)
    .map(e => `${e.id}:${e.version}`)
    .sort();
export const recipeMealVersions = (state: QuantityState, recipeId: string) =>
  records(state, 'meal')
    .filter(m => m.recipeId === recipeId)
    .map(m => `${m.id}:${m.version}`)
    .sort();
export const operationParents = (operation: Operation) =>
  operation.commit
    ? [...new Set([...operation.parents, ...operation.commit.parents])]
    : operation.parents;
export const totalFor = (state: QuantityState, rowId: string) =>
  state.complete
    ? Math.round(
        entriesFor(state, rowId).reduce(
          (sum, entry) => sum + entry.quantity,
          0
        ) * 1e6
      ) / 1e6
    : null;

/** Validate the entire result before committing any part of an operation. */
export function validateDocuments(documents: QuantityState['documents']) {
  const sources = new Set<string>();
  for (const value of Object.values(documents)) {
    assertDocument(value);
    if (!value.id || !value.version) throw new Error('Missing identity');
    if (
      value.kind === 'list' ||
      value.kind === 'recipe' ||
      value.kind === 'meal'
    ) {
      if (!value.name.trim()) throw new Error('A name is required');
    }
    if (value.kind === 'row') {
      if (
        (!value.name.trim() && value.status !== 'deleted') ||
        documents[value.listId]?.kind !== 'list'
      )
        throw new Error('Invalid shopping row');
      if (
        value.unit !== normalize(value.unit) ||
        !['active', 'checked', 'deleted'].includes(value.status)
      )
        throw new Error('Invalid row unit or state');
    }
    if (value.kind === 'recipe' || value.kind === 'meal') {
      if (
        new Set(value.ingredients.map(i => i.id)).size !==
        value.ingredients.length
      )
        throw new Error('Duplicate ingredient identity');
      for (const ingredient of value.ingredients) {
        if (!ingredient.name.trim() || !validQuantity(ingredient.quantity))
          throw new Error('Invalid ingredient');
      }
    }
    if (value.kind === 'meal') {
      const source = value.recipeId ? documents[value.recipeId] : undefined;
      if (source?.kind === 'recipe' && source.deleted)
        throw new Error('This recipe has been deleted');
      if (
        documents[value.listId]?.kind !== 'list' ||
        !validQuantity(value.servings) ||
        value.servings === 0
      )
        throw new Error('Invalid meal');
    }
    if (value.kind === 'entry') {
      const row = documents[value.rowId];
      if (
        row?.kind !== 'row' ||
        !validQuantity(value.quantity) ||
        normalize(value.unit) !== row.unit
      )
        throw new Error('Invalid quantity entry');
      if (row.status === 'active' && value.sourceId) {
        if (sources.has(value.sourceId))
          throw new Error('Source already has a shopping contribution');
        sources.add(value.sourceId);
        const meal = value.mealId ? documents[value.mealId] : null;
        if (
          meal?.kind !== 'meal' ||
          meal.listId !== row.listId ||
          !meal.ingredients.some(i => i.id === value.sourceId && i.selected)
        )
          throw new Error('Missing selected meal source');
      }
    }
  }
}

/**
 * Deterministic causal replay. Concurrent stale writes are retained as conflicts,
 * never silently overwritten. A move/source update is one indivisible operation.
 * Missing ancestors or malformed records fail closed, including cached reads.
 */
type ReplayCheckpoint = { key: string; state: QuantityState };

/** A workspace-local replay cache. Any changed/reordered operation invalidates
 * its suffix; the complete history is still validated before checkpoints apply. */
export function createMaterializer() {
  const cache: { checkpoints: ReplayCheckpoint[] } = { checkpoints: [] };
  return (
    operations: readonly Operation[],
    optimisticIds: ReadonlySet<string> = new Set()
  ) => replay(operations, optimisticIds, cache);
}

export function materialize(
  operations: readonly Operation[],
  optimisticIds: ReadonlySet<string> = new Set()
): QuantityState {
  return replay(operations, optimisticIds);
}

function replay(
  operations: readonly Operation[],
  optimisticIds: ReadonlySet<string>,
  cache?: { checkpoints: ReplayCheckpoint[] }
): QuantityState {
  const checkpoints: ReplayCheckpoint[] = [];
  let reusable = true;
  let state: QuantityState = {
    documents: {},
    heads: [],
    conflicts: [],
    complete: true,
    error: null,
  };
  const pending = new Map<string, Operation>();
  const applied = new Set<string>();
  const referenced = new Set<string>();
  try {
    for (const op of operations) {
      assertOperation(op);
      const existing = pending.get(op.id);
      if (existing && JSON.stringify(existing) !== JSON.stringify(op))
        throw new Error('An operation identity was reused');
      pending.set(op.id, op);
      operationParents(op).forEach(id => referenced.add(id));
    }
    const committed = [...pending.values()]
      .filter(op => op.commit)
      .sort((a, b) => a.commit!.sequence - b.commit!.sequence);
    committed.forEach((op, index) => {
      if (
        op.commit!.sequence !== index + 1 ||
        (index > 0 && !op.commit!.parents.includes(committed[index - 1].id))
      )
        throw new Error('Waiting for the complete committed history');
    });
    if (committed.length) {
      const ancestors = new Set<string>();
      const visit = (id: string) => {
        if (ancestors.has(id)) return;
        ancestors.add(id);
        const op = pending.get(id);
        if (op) operationParents(op).forEach(visit);
      };
      operationParents(committed[0]).forEach(visit);
      for (const op of pending.values()) {
        if (!op.commit && !ancestors.has(op.id) && !optimisticIds.has(op.id))
          throw new Error(
            'An unsupported writer changed this list. Reconnect with the updated app.'
          );
      }
    }
    // Process causal generations in linear graph traversal rather than scanning
    // every remaining operation again for each historical write.
    const remainingParents = new Map<string, number>();
    const children = new Map<string, string[]>();
    let ready: Operation[] = [];
    for (const op of pending.values()) {
      const parents = [...new Set(operationParents(op))];
      remainingParents.set(op.id, parents.length);
      if (!parents.length) ready.push(op);
      for (const parent of parents) {
        const dependents = children.get(parent) ?? [];
        dependents.push(op.id);
        children.set(parent, dependents);
      }
    }
    while (pending.size) {
      ready.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      if (!ready.length)
        throw new Error('Waiting for missing operation history');
      const nextReady: Operation[] = [];
      for (const op of ready) {
        for (const childId of children.get(op.id) ?? []) {
          const count = remainingParents.get(childId)! - 1;
          remainingParents.set(childId, count);
          if (count === 0) nextReady.push(pending.get(childId)!);
        }
        pending.delete(op.id);
        applied.add(op.id);
        const key = cache ? JSON.stringify(op) : '';
        const previous = cache?.checkpoints[checkpoints.length];
        if (cache && reusable && previous?.key === key) {
          state = previous.state;
          checkpoints.push(previous);
          continue;
        }
        reusable = false;
        try {
          const ids = new Set<string>();
          for (const guard of op.guards) {
            if (guard.kind === 'version') {
              if (state.documents[guard.id]?.version !== guard.version)
                throw new Error(
                  'This item changed on another device. Review and try again.'
                );
            } else if (
              JSON.stringify(
                guard.kind === 'entries'
                  ? entryVersions(state, guard.rowId)
                  : recipeMealVersions(state, guard.recipeId)
              ) !== JSON.stringify(guard.versions)
            )
              throw new Error(
                'The quantities changed before this action completed. Review the current total.'
              );
          }
          for (const change of op.changes) {
            const previous = state.documents[change.id];
            if (
              previous?.kind === 'recipe' &&
              previous.deleted &&
              (change.value?.kind !== 'recipe' || !change.value.deleted)
            )
              throw new Error('This recipe has been deleted');
            if (
              ids.has(change.id) ||
              (change.value && change.value.id !== change.id)
            )
              throw new Error('Invalid change identity');
            ids.add(change.id);
            if ((state.documents[change.id]?.version ?? null) !== change.before)
              throw new Error(
                'Another edit changed the same item. Your attempted change is saved for review.'
              );
          }
          const documents = { ...state.documents };
          for (const change of op.changes) {
            if (change.value)
              documents[change.id] = { ...change.value, version: op.id };
            else delete documents[change.id];
          }
          validateDocuments(documents);
          state = {
            ...state,
            documents,
            conflicts: state.conflicts.filter(
              c => !op.resolves.includes(c.operation.id)
            ),
          };
        } catch (error) {
          state = {
            ...state,
            conflicts: [
              ...state.conflicts,
              {
                operation: op,
                reason:
                  error instanceof Error
                    ? error.message
                    : 'Unable to apply this change',
              },
            ],
          };
        }
        if (cache) checkpoints.push({ key, state });
      }
      ready = nextReady;
    }
    state = {
      ...state,
      heads: [...applied].filter(id => !referenced.has(id)).sort(),
    };
    if (cache) cache.checkpoints = checkpoints;
  } catch (error) {
    state = {
      ...state,
      complete: false,
      error:
        error instanceof Error ? error.message : 'Unable to read quantities',
    };
  }
  return state;
}
