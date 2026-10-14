import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';

import { type ListAccessTimes } from '../utils/sort-grocery-lists-by-last-access';

/**
 * Device-local record of when each grocery list was last opened.
 *
 * This is deliberately NOT synced. When it lived on `grocery_list_shares`,
 * two devices signed into the same account fed each other's writes back into
 * the list order (and the home screen's default list), so both screens
 * reordered and switched lists in a loop.
 */

const STORAGE_KEY_PREFIX = 'grocery-lists:last-accessed';

type UserListAccessState = {
  accessTimes: ListAccessTimes;
  isHydrated: boolean;
  /** Whether this device already has access times for the user (stored or recorded). */
  hasLocalValue: boolean;
};

const EMPTY_STATE: UserListAccessState = {
  accessTimes: {},
  isHydrated: false,
  hasLocalValue: false,
};

const states = new Map<string, UserListAccessState>();
const hydrations = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();

const storageKey = (userId: string) => `${STORAGE_KEY_PREFIX}:${userId}`;

const getState = (userId: string) => states.get(userId) ?? EMPTY_STATE;

const setState = (userId: string, next: UserListAccessState) => {
  states.set(userId, next);
  listeners.forEach(listener => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const parseAccessTimes = (value: string | null): ListAccessTimes | null => {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string'
      )
    );
  } catch {
    return null;
  }
};

const persist = (userId: string) =>
  AsyncStorage.setItem(
    storageKey(userId),
    JSON.stringify(getState(userId).accessTimes)
  ).catch(() => undefined);

const hydrate = (userId: string): Promise<void> => {
  const existing = hydrations.get(userId);
  if (existing) return existing;

  const hydration = AsyncStorage.getItem(storageKey(userId))
    .catch(() => null)
    .then(value => {
      const stored = parseAccessTimes(value);
      const current = getState(userId);

      setState(userId, {
        // Accesses recorded while hydrating are newer than anything stored.
        accessTimes: { ...stored, ...current.accessTimes },
        isHydrated: true,
        hasLocalValue: stored !== null || current.hasLocalValue,
      });
    });

  hydrations.set(userId, hydration);
  return hydration;
};

export const recordListAccess = (userId: string, listId: string) => {
  const current = getState(userId);

  setState(userId, {
    ...current,
    accessTimes: {
      ...current.accessTimes,
      [listId]: new Date().toISOString(),
    },
    hasLocalValue: true,
  });

  // Persist only after hydrating so we never overwrite stored times with a
  // partial in-memory map.
  void hydrate(userId).then(() => persist(userId));
};

/**
 * One-time migration: seeds access times from the legacy server field when
 * this device has none for the user yet. No-op once anything is stored.
 */
export const seedListAccessTimes = (
  userId: string,
  legacyAccessTimes: ListAccessTimes
) => {
  const current = getState(userId);
  if (!current.isHydrated || current.hasLocalValue) return;

  setState(userId, {
    accessTimes: { ...legacyAccessTimes, ...current.accessTimes },
    isHydrated: true,
    hasLocalValue: true,
  });
  void persist(userId);
};

export const useListAccessTimes = (userId: string | undefined) => {
  useEffect(() => {
    if (userId) {
      void hydrate(userId);
    }
  }, [userId]);

  return useSyncExternalStore(subscribe, () =>
    userId ? getState(userId) : EMPTY_STATE
  );
};
