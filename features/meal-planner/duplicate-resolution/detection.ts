import type {
  DuplicateConflict,
  DuplicateDetection,
  DuplicateItemFields,
  ExistingDuplicateItem,
  IncomingDuplicateItem,
} from './types';

export const normalizeDuplicateToken = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

const storeKey = (item: DuplicateItemFields): string | null =>
  item.storeId || null;

export const canCombineDuplicateItems = (
  incoming: DuplicateItemFields,
  existing: DuplicateItemFields
): boolean =>
  normalizeDuplicateToken(incoming.unit) ===
    normalizeDuplicateToken(existing.unit) &&
  storeKey(incoming) === storeKey(existing);

const validFields = (item: DuplicateItemFields, incoming: boolean): boolean =>
  typeof item.name === 'string' &&
  Boolean(item.name.trim()) &&
  typeof item.unit === 'string' &&
  Number.isFinite(item.quantity) &&
  (incoming ? item.quantity > 0 : item.quantity >= 0) &&
  (item.storeId == null || typeof item.storeId === 'string');

/** Throws on invalid batch inputs; planning converts these into typed errors. */
export const validateDuplicateInputs = ({
  listId,
  incoming,
  existingItems,
}: {
  listId: string;
  incoming: IncomingDuplicateItem[];
  existingItems: ExistingDuplicateItem[];
}): void => {
  const sourceIds = new Set<string>();
  const existingIds = new Set<string>();
  if (!listId.trim()) throw new Error('A destination list ID is required.');
  for (const item of incoming) {
    if (
      !validFields(item, true) ||
      !item.sourceId?.trim() ||
      sourceIds.has(item.sourceId) ||
      !['recipe-ingredient', 'meal-plan-item'].includes(item.sourceKind)
    ) {
      throw new Error(
        'Incoming items need unique source IDs and positive finite quantities.'
      );
    }
    sourceIds.add(item.sourceId);
  }
  for (const item of existingItems) {
    if (
      !validFields(item, false) ||
      !item.id?.trim() ||
      !item.listId?.trim() ||
      existingIds.has(item.id) ||
      typeof item.isChecked !== 'boolean' ||
      (item.isDeleted != null && typeof item.isDeleted !== 'boolean')
    ) {
      throw new Error(
        'Existing items need unique IDs and nonnegative finite quantities.'
      );
    }
    existingIds.add(item.id);
  }
};

const timestamp = (value?: string | null): number => {
  const parsed = value ? Date.parse(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
};

const newestFirst = (
  left: ExistingDuplicateItem,
  right: ExistingDuplicateItem
) =>
  timestamp(right.updatedAt) - timestamp(left.updatedAt) ||
  (left.id < right.id ? -1 : left.id > right.id ? 1 : 0);

const blockedReason = (
  incoming: IncomingDuplicateItem,
  candidates: ExistingDuplicateItem[]
): DuplicateConflict['incrementBlockedReason'] => {
  const unitMatches = candidates.some(
    item =>
      normalizeDuplicateToken(item.unit) ===
      normalizeDuplicateToken(incoming.unit)
  );
  const storeMatches = candidates.some(
    item => storeKey(item) === storeKey(incoming)
  );
  if (!unitMatches && storeMatches) return 'unit';
  if (unitMatches && !storeMatches) return 'store';
  return 'unit-and-store';
};

/** Captures a detached review snapshot. Incoming items never match one another. */
export const detectDuplicates = ({
  listId,
  incoming,
  existingItems,
}: {
  listId: string;
  incoming: IncomingDuplicateItem[];
  existingItems: ExistingDuplicateItem[];
}): DuplicateDetection => {
  validateDuplicateInputs({ listId, incoming, existingItems });
  const incomingSnapshot = incoming.map(item => ({ ...item }));
  const byName = new Map<string, ExistingDuplicateItem[]>();
  for (const item of existingItems) {
    if (item.listId !== listId || item.isChecked || item.isDeleted) continue;
    const key = normalizeDuplicateToken(item.name);
    const candidates = byName.get(key) ?? [];
    candidates.push({ ...item });
    byName.set(key, candidates);
  }
  for (const candidates of byName.values()) candidates.sort(newestFirst);

  const conflicts: DuplicateConflict[] = [];
  const nonConflicting: IncomingDuplicateItem[] = [];
  for (const item of incomingSnapshot) {
    const candidates = byName.get(normalizeDuplicateToken(item.name));
    if (!candidates?.length) {
      nonConflicting.push(item);
      continue;
    }
    const target = candidates.find(candidate =>
      canCombineDuplicateItems(item, candidate)
    );
    conflicts.push({
      id: item.sourceId,
      incoming: item,
      candidates: candidates.map(candidate => ({ ...candidate })),
      targetId: target?.id ?? null,
      canIncrement: Boolean(target),
      incrementBlockedReason: target ? null : blockedReason(item, candidates),
    });
  }
  return { listId, incoming: incomingSnapshot, conflicts, nonConflicting };
};
