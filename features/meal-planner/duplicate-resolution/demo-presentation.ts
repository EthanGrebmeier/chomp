import { planDuplicateResolution } from './planning';
import type {
  DuplicateConflict,
  DuplicateDecisions,
  DuplicateDetection,
  ExistingDuplicateItem,
} from './types';

/** Preview this choice without treating other unresolved items as increments. */
export const getDemoIncrementPreviewQuantity = ({
  conflict,
  detection,
  decisions,
  existingItems,
}: {
  conflict: DuplicateConflict | null;
  detection: DuplicateDetection;
  decisions: DuplicateDecisions;
  existingItems: ExistingDuplicateItem[];
}): number | null => {
  if (!conflict?.canIncrement) return null;
  const previewDecisions = Object.fromEntries(
    detection.conflicts.map(item => [item.id, decisions[item.id] ?? 'separate'])
  ) as DuplicateDecisions;
  // Replace, rather than add to, the current staged choice when revisiting it.
  previewDecisions[conflict.id] = 'increment';
  const preview = planDuplicateResolution({
    detection,
    decisions: previewDecisions,
    existingItems,
  });
  const target = conflict.candidates.find(
    item => item.id === conflict.targetId
  );
  if (!preview.ok || !target) return null;
  const delta = preview.plan.increments.find(
    item => item.targetId === target.id
  )?.quantityDelta;
  return target.quantity + (delta ?? 0);
};
