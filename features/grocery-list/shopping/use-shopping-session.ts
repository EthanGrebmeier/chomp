import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { toast } from 'sonner-native';

import { parseShoppingSession, type ShoppingSession } from './destinations';

type Snapshot = { ready: boolean; session: ShoppingSession | null };
const EMPTY: Snapshot = { ready: false, session: null };
const states = new Map<string, Snapshot>();
const hydration = new Map<string, Promise<void>>();
const writes = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const publish = (key: string, snapshot: Snapshot) => {
  states.set(key, snapshot);
  listeners.forEach(listener => listener());
};

/** Device-local, account- and list-scoped presentation; item data stays shared. */
export function useShoppingSession(userId?: string, listId?: string) {
  const key = userId && listId ? `shopping:${userId}:${listId}` : null;
  const snapshot = useSyncExternalStore(
    subscribe,
    () => (key ? (states.get(key) ?? EMPTY) : EMPTY),
    () => EMPTY
  );

  useEffect(() => {
    if (!key || hydration.has(key)) return;
    const pending = AsyncStorage.getItem(key)
      .catch(() => null)
      .then(value => {
        publish(key, { ready: true, session: parseShoppingSession(value) });
      });
    hydration.set(key, pending);
  }, [key]);

  const setSession = useCallback(
    (session: ShoppingSession | null) => {
      if (!key || !snapshot.ready) return;
      publish(key, { ready: true, session });
      const pending = (writes.get(key) ?? Promise.resolve())
        .then(() => AsyncStorage.setItem(key, JSON.stringify(session)))
        .catch(() => {
          toast.error('Could not remember your shopping position');
        });
      writes.set(key, pending);
    },
    [key, snapshot.ready]
  );

  return { ...snapshot, setSession };
}
