import { useSyncExternalStore } from 'react';

import { materialize } from '../model';
import type { Operation, QuantityState } from '../types';
import type { useQuantityWorkspace } from '../use-quantity-workspace';

export type ListSession = ReturnType<typeof useQuantityWorkspace>;
const sessions = new Map<string, ListSession>();
const listeners = new Set<() => void>();
export const emptyListSession: ListSession = {
  state: materialize([]),
  canEdit: false,
  loading: true,
  error: undefined,
  pending: [],
  connection: 'connecting',
  workspace: undefined,
  send: async () => {
    throw new Error('Wait for your list to finish loading');
  },
  refresh: async () => {},
  retry: async () => {},
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export function publishListSession(
  listId: string,
  session: ListSession | null
) {
  if (session) sessions.set(listId, session);
  else sessions.delete(listId);
  listeners.forEach(listener => listener());
}
export function useQuantityList(listId?: string) {
  return useSyncExternalStore(
    subscribe,
    () => sessions.get(listId ?? '') ?? emptyListSession
  );
}
export function listSession(listId: string) {
  const session = sessions.get(listId);
  if (!session?.canEdit)
    throw new Error(session?.error ?? 'Wait for your list to finish loading');
  return session;
}
export function documentSession(documentId: string) {
  for (const [listId, session] of sessions) {
    if (
      session.state.documents[documentId] ||
      Object.values(session.state.documents).some(
        doc =>
          doc.kind === 'meal' && doc.ingredients.some(i => i.id === documentId)
      )
    )
      return { listId, ...listSession(listId) };
  }
  throw new Error(
    'This item is no longer available. Reopen the list and try again.'
  );
}
export function allListSessions() {
  return [...sessions.entries()];
}
export function changeList(
  listId: string,
  build: (state: QuantityState) => Operation
) {
  const session = listSession(listId);
  return sendAndObserveListOperation(listId, build(session.state));
}
export function changeDocument(
  documentId: string,
  build: (state: QuantityState) => Operation
) {
  const session = documentSession(documentId);
  return sendAndObserveListOperation(session.listId, build(session.state));
}

/**
 * Finish a UI action once its durable intent has reached the published model.
 * send() alone resolves after disk persistence, before React publishes that model.
 * Waiting for publication lets useOptimistic hand back without a stale-state flash.
 * This never waits for a network acknowledgement.
 */
export async function sendAndObserveListOperation(
  listId: string,
  operation: Operation
) {
  const session = listSession(listId);
  let unsubscribe = () => {};
  let observe = () => {};
  let persisted = false;
  const published = new Promise<void>((resolve, reject) => {
    observe = () => {
      const current = sessions.get(listId);
      if (!current) {
        reject(new Error('This list is no longer available.'));
        return;
      }
      if (!persisted) return;
      if (
        current.pending.some(item => item.operation.id === operation.id) ||
        current.state.heads.includes(operation.id) ||
        current.state.conflicts.some(
          conflict => conflict.operation.id === operation.id
        ) ||
        Object.values(current.state.documents).some(
          document => document.version === operation.id
        )
      )
        resolve();
    };
    unsubscribe = subscribe(observe);
  });
  // Attach rejection handling immediately, including removal during persistence.
  const saving = Promise.resolve()
    .then(() => session.send(operation))
    .then(() => {
      persisted = true;
      observe();
    });
  try {
    await Promise.all([saving, published]);
  } finally {
    unsubscribe();
  }
}
