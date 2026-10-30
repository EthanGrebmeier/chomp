import {
  ConflictReviewRow,
  type ConflictIndexTreatment,
} from '@/components/conflict-review-row';
import {
  getDemoConflictDifferences,
  getDemoDecisionSummary,
  type DemoChoice,
  type DemoCustomAmount,
} from '@/features/meal-planner/duplicate-resolution/demo-choices';
import type { DuplicateConflict } from '@/features/meal-planner/duplicate-resolution/types';

export {
  CONFLICT_INDEX_TREATMENTS,
  type ConflictIndexTreatment,
} from '@/components/conflict-review-row';

export function ConflictIndexRow({
  treatment,
  conflict,
  choice,
  customAmount,
  disabled,
  onPress,
}: {
  treatment: ConflictIndexTreatment;
  conflict: DuplicateConflict;
  choice: DemoChoice;
  customAmount?: DemoCustomAmount;
  disabled: boolean;
  onPress: () => void;
}) {
  const differences = getDemoConflictDifferences(conflict);
  const summary = getDemoDecisionSummary(conflict, choice, customAmount);
  return (
    <ConflictReviewRow
      treatment={treatment}
      name={conflict.incoming.name}
      detail={
        differences.length > 0
          ? differences.join(' · ')
          : 'Already on your list.'
      }
      summary={summary.label}
      accessibilitySummary={[
        ...differences,
        summary.label,
        summary.detail,
      ].join('. ')}
      differences={differences}
      complete={summary.complete}
      disabled={disabled}
      onPress={onPress}
    />
  );
}
