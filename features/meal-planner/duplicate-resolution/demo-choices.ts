import { normalizeDuplicateToken } from './detection';
import { DEMO_STORE_NAMES } from './demo-fixtures';
import type { DuplicateConflict } from './types';

// UI exploration only. Store preferences are not executable planner decisions.
export type DemoChoice =
  | 'increment'
  | 'separate'
  | 'existing-store'
  | 'incoming-store'
  | 'custom-amount';
export type DemoDecisions = Record<string, DemoChoice>;

/** The user-entered total for a `custom-amount` choice; null while invalid. */
export type DemoCustomAmount = {
  quantity: number | null;
  unit: string;
  /** Defaults to the existing item's store; independent of the chosen unit. */
  store?: 'existing' | 'incoming';
};
export type DemoCustomAmounts = Record<string, DemoCustomAmount>;

export const formatDemoQuantity = (quantity: number, unit: string) =>
  `${Number(quantity.toFixed(4))} ${unit}`.trim();

/** Accepts "1.5" or "1,5"; anything that isn't a positive finite number is null. */
export const parseDemoQuantity = (text: string): number | null => {
  const trimmed = text.trim().replace(',', '.');
  if (!trimmed) return null;
  const quantity = Number(trimmed);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : null;
};

export const demoStoreLabel = (storeId?: string | null) =>
  storeId ? (DEMO_STORE_NAMES[storeId] ?? storeId) : 'No store';

const combineLabel = (storeId?: string | null) =>
  storeId ? `Combine at ${demoStoreLabel(storeId)}` : 'Combine without a store';

export function getDemoComparisonTarget(conflict: DuplicateConflict) {
  return (
    conflict.candidates.find(item => item.id === conflict.targetId) ??
    conflict.candidates.find(
      item =>
        normalizeDuplicateToken(item.unit) ===
        normalizeDuplicateToken(conflict.incoming.unit)
    ) ??
    conflict.candidates[0]
  );
}

/** Differences worth reviewing, independent of whether quantities can be added. */
export function getDemoConflictDifferences(
  conflict: DuplicateConflict
): string[] {
  const existing = getDemoComparisonTarget(conflict);
  const differences: string[] = [];
  if ((existing.storeId || null) !== (conflict.incoming.storeId || null)) {
    differences.push('Different stores');
  }
  if (
    normalizeDuplicateToken(existing.unit) !==
    normalizeDuplicateToken(conflict.incoming.unit)
  ) {
    differences.push('Different units');
  } else if (existing.quantity !== conflict.incoming.quantity) {
    differences.push('Different quantities');
  }
  return differences;
}

/** Stable partition: harder pairs first, preserving source order within each group. */
export const sortDemoConflictsForReview = (conflicts: DuplicateConflict[]) =>
  [...conflicts].sort(
    (a, b) =>
      Number(getDemoConflictDifferences(b).length > 0) -
      Number(getDemoConflictDifferences(a).length > 0)
  );

export function getDemoChoiceOptions(
  conflict: DuplicateConflict
): { id: DemoChoice; label: string }[] {
  const separate = { id: 'separate' as const, label: 'Keep separate' };
  if (conflict.canIncrement) {
    return [{ id: 'increment', label: 'Combine quantities' }, separate];
  }
  const target = getDemoComparisonTarget(conflict);
  if (
    normalizeDuplicateToken(target.unit) !==
    normalizeDuplicateToken(conflict.incoming.unit)
  ) {
    // Units can't be added automatically, so the user supplies the total.
    return [separate, { id: 'custom-amount', label: 'Set a combined total' }];
  }
  return [
    separate,
    {
      id: 'existing-store',
      label: combineLabel(target.storeId),
    },
    {
      id: 'incoming-store',
      label: combineLabel(conflict.incoming.storeId),
    },
  ];
}

/** Starts from what's already on the list, which is also the "I have enough" answer. */
export const getDefaultDemoCustomAmount = (
  conflict: DuplicateConflict
): DemoCustomAmount => {
  const target = getDemoComparisonTarget(conflict);
  return { quantity: target.quantity, unit: target.unit };
};

/** The two units in play; a custom total may use either. */
export const getDemoCustomAmountUnits = (conflict: DuplicateConflict) => {
  const existingUnit = getDemoComparisonTarget(conflict).unit;
  return normalizeDuplicateToken(existingUnit) ===
    normalizeDuplicateToken(conflict.incoming.unit)
    ? [existingUnit]
    : [existingUnit, conflict.incoming.unit];
};

export const getDemoCustomAmountStoreOptions = (
  conflict: DuplicateConflict
): { id: 'existing' | 'incoming'; label: string }[] => {
  const target = getDemoComparisonTarget(conflict);
  if ((target.storeId || null) === (conflict.incoming.storeId || null)) {
    return [];
  }
  return [
    { id: 'existing', label: demoStoreLabel(target.storeId) },
    { id: 'incoming', label: demoStoreLabel(conflict.incoming.storeId) },
  ];
};

/** Descriptions stay visible before selection so the consequences are clear. */
export function getDemoChoiceDescription(
  conflict: DuplicateConflict,
  choice: DemoChoice
): string {
  if (choice === 'custom-amount') {
    return getDemoCustomAmountStoreOptions(conflict).length > 0
      ? 'Different units: enter the total and choose a unit and store. No automatic conversion.'
      : 'Different units: enter the total and choose a unit. No automatic conversion.';
  }
  return getDemoDecisionSummary(conflict, choice).detail;
}

export const isDemoDecisionComplete = (
  choice: DemoChoice,
  customAmount?: DemoCustomAmount
) =>
  choice !== 'custom-amount' ||
  (customAmount?.quantity != null &&
    Number.isFinite(customAmount.quantity) &&
    customAmount.quantity > 0);

export const demoChoiceLabel = (
  conflict: DuplicateConflict,
  choice?: DemoChoice,
  customAmount?: DemoCustomAmount
) => {
  if (choice === 'custom-amount' && customAmount?.quantity != null) {
    const store =
      getDemoCustomAmountStoreOptions(conflict).length > 0
        ? ` · ${demoStoreLabel(customAmount.store === 'incoming' ? conflict.incoming.storeId : getDemoComparisonTarget(conflict).storeId)}`
        : '';
    return `Combine as ${formatDemoQuantity(customAmount.quantity, customAmount.unit)}${store}`;
  }
  return (
    getDemoChoiceOptions(conflict).find(option => option.id === choice)
      ?.label ?? 'Not decided'
  );
};

/** A per-item preview, not an aggregate of other incoming items in the batch. */
export function getDemoDecisionSummary(
  conflict: DuplicateConflict,
  choice: DemoChoice,
  customAmount?: DemoCustomAmount
): { complete: boolean; label: string; detail: string } {
  const target = getDemoComparisonTarget(conflict);
  const incoming = conflict.incoming;
  if (!isDemoDecisionComplete(choice, customAmount)) {
    return {
      complete: false,
      label: 'Needs an amount',
      detail: 'Enter a new total to combine this item.',
    };
  }
  const label = demoChoiceLabel(conflict, choice, customAmount);
  if (choice === 'separate') {
    return {
      complete: true,
      label,
      detail: `Add ${formatDemoQuantity(incoming.quantity, incoming.unit)} · ${demoStoreLabel(incoming.storeId)}. Existing item unchanged.`,
    };
  }
  if (choice === 'custom-amount' && customAmount?.quantity != null) {
    return {
      complete: true,
      label,
      detail: `${formatDemoQuantity(customAmount.quantity, customAmount.unit)} new total · ${demoStoreLabel(customAmount.store === 'incoming' ? incoming.storeId : target.storeId)}`,
    };
  }
  const storeId =
    choice === 'incoming-store' ? incoming.storeId : target.storeId;
  return {
    complete: true,
    label,
    detail: `${formatDemoQuantity(target.quantity + incoming.quantity, target.unit)} after combining this item · ${demoStoreLabel(storeId)}`,
  };
}

/**
 * The choice an item starts with before the user opens it. Only exact-compatible
 * items combine by default; anything with a store or unit difference stays
 * separate so nothing moves between stores without the user asking.
 */
export const getDefaultDemoChoice = (
  conflict: DuplicateConflict
): DemoChoice => (conflict.canIncrement ? 'increment' : 'separate');

export const getDefaultDemoDecisions = (
  conflicts: DuplicateConflict[]
): DemoDecisions =>
  Object.fromEntries(
    conflicts.map(conflict => [conflict.id, getDefaultDemoChoice(conflict)])
  );
