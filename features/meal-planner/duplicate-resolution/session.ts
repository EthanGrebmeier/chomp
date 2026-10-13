import type {
  DuplicateConflict,
  DuplicateDecisions,
  DuplicateResolutionChoice,
} from './types';

const hasValidChoice = (
  conflict: DuplicateConflict,
  decisions: DuplicateDecisions
) => {
  if (!Object.prototype.hasOwnProperty.call(decisions, conflict.id))
    return false;
  const choice = decisions[conflict.id];
  return (
    choice === 'separate' || (choice === 'increment' && conflict.canIncrement)
  );
};

export const recordDecision = (
  decisions: DuplicateDecisions,
  conflictId: string,
  choice: DuplicateResolutionChoice
): DuplicateDecisions => ({ ...decisions, [conflictId]: choice });

export const getDuplicateProgress = (
  conflicts: DuplicateConflict[],
  decisions: DuplicateDecisions
): { resolved: number; total: number } => ({
  resolved: conflicts.filter(conflict => hasValidChoice(conflict, decisions))
    .length,
  total: conflicts.length,
});

/** Earlier answers are preserved; a currently revisited item may be revised. */
export const applyChoiceToRemaining = ({
  conflicts,
  decisions,
  choice,
  currentConflictId,
}: {
  conflicts: DuplicateConflict[];
  decisions: DuplicateDecisions;
  choice: DuplicateResolutionChoice;
  currentConflictId: string;
}): {
  decisions: DuplicateDecisions;
  appliedCount: number;
  remainingCount: number;
} => {
  const next = { ...decisions };
  let appliedCount = 0;
  if (conflicts.some(conflict => conflict.id === currentConflictId)) {
    for (const conflict of conflicts) {
      if (
        conflict.id !== currentConflictId &&
        hasValidChoice(conflict, decisions)
      )
        continue;
      if (choice === 'increment' && !conflict.canIncrement) continue;
      next[conflict.id] = choice;
      appliedCount += 1;
    }
  }
  const progress = getDuplicateProgress(conflicts, next);
  return {
    decisions: next,
    appliedCount,
    remainingCount: progress.total - progress.resolved,
  };
};
