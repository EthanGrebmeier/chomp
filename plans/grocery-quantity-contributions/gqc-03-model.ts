/** GQC-03 proof model only. Not wired into the application or InstantDB schema. */
export type Entry = {
  id: string;
  rowId: string;
  sourceId?: string;
  quantity: number;
  unit: string;
  active: boolean;
};

export type EntryRead =
  | { state: 'loading' | 'error' | 'offline'; entries?: never }
  | { state: 'complete'; entries: readonly Entry[] };

export const normalizeUnit = (unit: string) =>
  unit.trim().toLocaleLowerCase('en-US').replace(/\s+/g, ' ');

/** Never interpret an absent or incomplete relation as zero quantity. */
export function deriveTotal(rowId: string, unit: string, read: EntryRead) {
  if (read.state !== 'complete') return null;

  const canonicalUnit = normalizeUnit(unit);
  let total = 0;
  for (const entry of read.entries) {
    if (entry.rowId !== rowId || !entry.active) continue;
    if (
      normalizeUnit(entry.unit) !== canonicalUnit ||
      !Number.isFinite(entry.quantity) ||
      entry.quantity < 0
    ) {
      return null;
    }
    total += entry.quantity;
    if (!Number.isFinite(total)) return null;
  }
  return total;
}

/** Test-only idempotent entry creation: one ID per intent, not one ID per row. */
export function addEntry(
  entries: readonly Entry[],
  entry: Entry
): readonly Entry[] {
  const existing = entries.find(current => current.id === entry.id);
  if (existing) {
    if (JSON.stringify(existing) !== JSON.stringify(entry)) {
      throw new Error('Entry ID reused with different intent');
    }
    return entries;
  }
  return [...entries, entry];
}

/** Model source sync as an update to its exact entry, never to a row total. */
export function syncSource(
  entries: readonly Entry[],
  sourceId: string,
  quantity: number,
  active: boolean
): readonly Entry[] {
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error('Invalid quantity');
  }
  return entries.map(entry =>
    entry.sourceId === sourceId && entry.active
      ? { ...entry, quantity, active }
      : entry
  );
}
