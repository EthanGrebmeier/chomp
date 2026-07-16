import { useCallback, useSyncExternalStore } from 'react';

import type { FrequentItem } from '../utils/frequent-items';

const CACHE_LIMIT = 20;
const cache = new Map<string, FrequentItem[]>();
const listeners = new Map<string, Set<() => void>>();

const subscribe = (key: string | null, listener: () => void) => {
  if (!key) return () => {};

  const keyListeners = listeners.get(key) ?? new Set();
  keyListeners.add(listener);
  listeners.set(key, keyListeners);

  return () => {
    keyListeners.delete(listener);
    if (keyListeners.size === 0) {
      listeners.delete(key);
    }
  };
};

export const getCachedFrequentItems = (
  key: string | null
): FrequentItem[] | undefined => (key ? cache.get(key) : undefined);

export const setCachedFrequentItems = (key: string, items: FrequentItem[]) => {
  cache.delete(key);
  cache.set(key, items);

  if (cache.size > CACHE_LIMIT) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) {
      cache.delete(oldestKey);
      listeners.get(oldestKey)?.forEach(listener => listener());
    }
  }

  listeners.get(key)?.forEach(listener => listener());
};

export const useCachedFrequentItems = (key: string | null) => {
  const subscribeToKey = useCallback(
    (listener: () => void) => subscribe(key, listener),
    [key]
  );
  const getSnapshot = useCallback(() => getCachedFrequentItems(key), [key]);

  return useSyncExternalStore(subscribeToKey, getSnapshot, getSnapshot);
};
