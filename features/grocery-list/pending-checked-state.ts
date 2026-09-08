import { useSyncExternalStore } from 'react';

/**
 * Tracks the user's *intended* checked state for items whose write has not
 * been confirmed yet.
 *
 * InstantDB applies writes optimistically, but on a degraded connection the
 * client SDK times out un-acked mutations after ~6s and rolls the optimistic
 * update back, which makes checked items visibly snap back to unchecked.
 * While a write is in flight (including retries after such a timeout) this
 * store overrides the query result so the row keeps reflecting what the user
 * tapped.
 *
 * Each item holds at most one entry, owned by the most recent toggle. Older
 * toggles identify themselves with the token returned from
 * `beginPendingCheckedState` so they cannot clear a newer intent.
 */

type PendingCheckedStateItem = {
  id: string;
  isChecked?: boolean;
};

type PendingCheckedStateEntry = {
  isChecked: boolean;
  token: number;
};

export type PendingCheckedState = ReadonlyMap<string, boolean>;

const EMPTY_PENDING_CHECKED_STATE: PendingCheckedState = new Map();

const entries = new Map<string, PendingCheckedStateEntry>();
const listeners = new Set<() => void>();
let snapshot: PendingCheckedState = EMPTY_PENDING_CHECKED_STATE;
let nextToken = 0;

const publish = () => {
  snapshot =
    entries.size === 0
      ? EMPTY_PENDING_CHECKED_STATE
      : new Map(
          Array.from(entries, ([itemId, entry]) => [itemId, entry.isChecked])
        );
  listeners.forEach(listener => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => snapshot;

/**
 * Records that the user wants `itemId` to be `isChecked` and returns a token
 * identifying this intent. Supersedes any earlier intent for the same item.
 */
export const beginPendingCheckedState = (
  itemId: string,
  isChecked: boolean
): number => {
  const token = ++nextToken;
  entries.set(itemId, { isChecked, token });
  publish();
  return token;
};

/** True while `token` is still the most recent intent for `itemId`. */
export const isPendingCheckedStateCurrent = (
  itemId: string,
  token: number
): boolean => entries.get(itemId)?.token === token;

/**
 * Removes the intent identified by `token`. No-op if a newer toggle has taken
 * over the item since.
 */
export const endPendingCheckedState = (itemId: string, token: number) => {
  if (!isPendingCheckedStateCurrent(itemId, token)) {
    return;
  }

  entries.delete(itemId);
  publish();
};

export const getPendingCheckedState = getSnapshot;

export const usePendingCheckedState = (): PendingCheckedState =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

/**
 * Returns `items` with `isChecked` overridden by any pending intent. Items
 * without a differing intent keep their original reference so list rows stay
 * memoized; when nothing changes the input array is returned as-is.
 */
export const applyPendingCheckedState = <T extends PendingCheckedStateItem>(
  items: T[],
  pending: PendingCheckedState
): T[] => {
  if (pending.size === 0) {
    return items;
  }

  let didChange = false;
  const nextItems = items.map(item => {
    const intendedIsChecked = pending.get(item.id);
    if (
      intendedIsChecked === undefined ||
      intendedIsChecked === Boolean(item.isChecked)
    ) {
      return item;
    }

    didChange = true;
    return { ...item, isChecked: intendedIsChecked };
  });

  return didChange ? nextItems : items;
};

/** Test-only: clears all intents and listeners. */
export const resetPendingCheckedStateForTests = () => {
  entries.clear();
  listeners.clear();
  snapshot = EMPTY_PENDING_CHECKED_STATE;
  nextToken = 0;
};
