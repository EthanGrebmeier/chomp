type CheckedStateItem = {
  id: string;
  isChecked?: boolean;
};

export type CheckedStateSnapshot = ReadonlyMap<string, boolean>;

export const createCheckedStateSnapshot = (
  items: CheckedStateItem[]
): CheckedStateSnapshot => {
  return new Map(items.map(item => [item.id, Boolean(item.isChecked)]));
};

export const hasCheckedStateTransition = (
  previous: CheckedStateSnapshot,
  current: CheckedStateSnapshot
): boolean => {
  for (const [itemId, isChecked] of current) {
    if (previous.has(itemId) && previous.get(itemId) !== isChecked) {
      return true;
    }
  }

  return false;
};

export const reconcilePresentedCheckedState = (
  presented: CheckedStateSnapshot,
  current: CheckedStateSnapshot
): CheckedStateSnapshot => {
  const reconciled = new Map<string, boolean>();

  for (const [itemId, isChecked] of current) {
    reconciled.set(itemId, presented.get(itemId) ?? isChecked);
  }

  const isUnchanged =
    reconciled.size === presented.size &&
    Array.from(reconciled).every(
      ([itemId, isChecked]) => presented.get(itemId) === isChecked
    );

  return isUnchanged ? presented : reconciled;
};

export const getPresentedCheckedState = (
  item: CheckedStateItem,
  presented: CheckedStateSnapshot
): boolean => {
  return presented.get(item.id) ?? Boolean(item.isChecked);
};

export const CHECKED_SECTION_SETTLE_DELAY_MS = 1000;

/** One trailing quiet window; publications with unchanged values cannot extend it. */
export function createCheckedStateSettler(
  initial: CheckedStateSnapshot,
  settle: (snapshot: CheckedStateSnapshot) => void
) {
  let latest = initial;
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    observe(next: CheckedStateSnapshot) {
      const changed = hasCheckedStateTransition(latest, next);
      latest = next;
      if (!changed) return;

      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        settle(new Map(latest));
      }, CHECKED_SECTION_SETTLE_DELAY_MS);
    },
    dispose() {
      clearTimeout(timer);
    },
  };
}
