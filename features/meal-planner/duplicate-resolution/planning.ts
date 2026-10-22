import { canCombineDuplicateItems, detectDuplicates } from './detection';
import type {
  DuplicateConflict,
  DuplicateDecisions,
  DuplicateDetection,
  DuplicateResolutionError,
  DuplicateResolutionPlan,
  DuplicateResolutionResult,
  ExistingDuplicateItem,
} from './types';

const sameCandidates = (left: DuplicateConflict, right: DuplicateConflict) =>
  left.targetId === right.targetId &&
  left.candidates.length === right.candidates.length &&
  left.candidates.every((item, index) => {
    const refreshed = right.candidates[index];
    return (
      item.id === refreshed.id &&
      item.name === refreshed.name &&
      item.quantity === refreshed.quantity &&
      item.unit === refreshed.unit &&
      (item.storeId || null) === (refreshed.storeId || null) &&
      (item.category ?? null) === (refreshed.category ?? null) &&
      (item.notes ?? null) === (refreshed.notes ?? null) &&
      (item.updatedAt ?? null) === (refreshed.updatedAt ?? null)
    );
  });

/**
 * Produces proposals only, never transaction chunks. Re-detection against the
 * latest input prevents confirming a review whose targets or quantities changed.
 */
export const planDuplicateResolution = ({
  detection,
  decisions,
  existingItems,
}: {
  detection: DuplicateDetection;
  decisions: DuplicateDecisions;
  existingItems: ExistingDuplicateItem[];
}): DuplicateResolutionResult => {
  const errors: DuplicateResolutionError[] = [];
  let refreshed: DuplicateDetection;
  try {
    refreshed = detectDuplicates({
      listId: detection.listId,
      incoming: detection.incoming,
      existingItems,
    });
  } catch (error) {
    return {
      ok: false,
      errors: [
        {
          code: 'invalid-input',
          conflictIds: [],
          message:
            error instanceof Error
              ? error.message
              : 'Invalid duplicate inputs.',
        },
      ],
    };
  }

  const conflictsById = new Map(
    detection.conflicts.map(conflict => [conflict.id, conflict])
  );
  const refreshedById = new Map(
    refreshed.conflicts.map(conflict => [conflict.id, conflict])
  );
  const staleIds = new Set<string>();
  for (const conflict of detection.conflicts) {
    const current = refreshedById.get(conflict.id);
    if (!current || !sameCandidates(conflict, current))
      staleIds.add(conflict.id);
  }
  for (const conflict of refreshed.conflicts) {
    if (!conflictsById.has(conflict.id)) staleIds.add(conflict.id);
  }
  if (staleIds.size) {
    errors.push({
      code: 'stale-input',
      conflictIds: [...staleIds],
      message:
        'The list changed during review. Review the refreshed duplicates before confirming.',
    });
  }

  const unknownIds = Object.keys(decisions).filter(
    id => !conflictsById.has(id)
  );
  if (unknownIds.length)
    errors.push({
      code: 'invalid-decision',
      conflictIds: unknownIds,
      message: 'Some decisions do not belong to this batch.',
    });
  const unresolvedIds: string[] = [];
  const invalidIds: string[] = [];
  for (const conflict of detection.conflicts) {
    if (!Object.prototype.hasOwnProperty.call(decisions, conflict.id)) {
      unresolvedIds.push(conflict.id);
      continue;
    }
    const choice = decisions[conflict.id];
    if (
      (choice !== 'increment' && choice !== 'separate') ||
      (choice === 'increment' && (!conflict.canIncrement || !conflict.targetId))
    )
      invalidIds.push(conflict.id);
  }
  if (unresolvedIds.length)
    errors.push({
      code: 'unresolved',
      conflictIds: unresolvedIds,
      message: 'Every duplicate needs a decision.',
    });
  if (invalidIds.length)
    errors.push({
      code: 'invalid-decision',
      conflictIds: invalidIds,
      message:
        'Some choices are invalid or attempt to combine incompatible units or stores.',
    });
  if (errors.length) return { ok: false, errors };

  const plan: DuplicateResolutionPlan = { creates: [], increments: [] };
  const increments = new Map<
    string,
    DuplicateResolutionPlan['increments'][number]
  >();
  for (const incoming of refreshed.incoming) {
    const conflict = refreshedById.get(incoming.sourceId);
    if (!conflict || decisions[conflict.id] === 'separate') {
      plan.creates.push({ ...incoming });
      continue;
    }
    const target = conflict.candidates.find(
      item => item.id === conflict.targetId
    );
    // Defense in depth: never turn a malformed increment into a create.
    if (!target || !canCombineDuplicateItems(incoming, target))
      return {
        ok: false,
        errors: [
          {
            code: 'stale-input',
            conflictIds: [conflict.id],
            message: 'The increment target is no longer compatible.',
          },
        ],
      };
    const increment = increments.get(target.id) ?? {
      targetId: target.id,
      quantityDelta: 0,
      sources: [],
    };
    increment.quantityDelta += incoming.quantity;
    increment.sources.push({ ...incoming });
    if (
      !Number.isFinite(increment.quantityDelta) ||
      !Number.isFinite(target.quantity + increment.quantityDelta)
    )
      return {
        ok: false,
        errors: [
          {
            code: 'invalid-input',
            conflictIds: [conflict.id],
            message:
              'The combined quantity exceeds the supported numeric range.',
          },
        ],
      };
    increments.set(target.id, increment);
  }
  plan.increments = [...increments.values()];
  return { ok: true, plan };
};
