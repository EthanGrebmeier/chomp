import { describe, expect, it } from 'vitest';

import {
  applyChoiceToRemaining,
  detectDuplicates,
  getDuplicateProgress,
  planDuplicateResolution,
  recordDecision,
} from './index';
import { DEMO_LIST_ID, DUPLICATE_DEMO_SCENARIOS } from './demo-fixtures';
import type { DuplicateDecisions } from './types';

const scenarioById = (id: string) =>
  DUPLICATE_DEMO_SCENARIOS.find(scenario => scenario.id === id)!;

const detectScenario = (id: string) => {
  const scenario = scenarioById(id);
  return {
    scenario,
    detection: detectDuplicates({
      listId: DEMO_LIST_ID,
      incoming: scenario.incoming,
      existingItems: scenario.existingItems,
    }),
  };
};

describe('duplicate-resolution demo scenarios', () => {
  it.each([
    ['none', 0],
    ['single', 1],
    ['mixed', 5],
    ['many', 20],
  ])('%s exposes its promised duplicate count', (id, count) => {
    const { detection } = detectScenario(id as string);
    expect(detection.conflicts).toHaveLength(count as number);
    expect(new Set(detection.incoming.map(item => item.sourceId)).size).toBe(
      detection.incoming.length
    );
  });

  it('the no-duplicate scenario can confirm immediately without writes', () => {
    const { scenario, detection } = detectScenario('none');
    const result = planDuplicateResolution({
      detection,
      decisions: {},
      existingItems: scenario.existingItems,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan.creates).toHaveLength(2);
      expect(result.plan.increments).toHaveLength(0);
    }
  });

  it('mixed bulk increment leaves incompatible items for separate choices', () => {
    const { scenario, detection } = detectScenario('mixed');
    expect(detection.conflicts[0].targetId).toBe('tomatoes-new');
    const batch = applyChoiceToRemaining({
      conflicts: detection.conflicts,
      decisions: {},
      choice: 'increment',
      currentConflictId: detection.conflicts[0].id,
    });
    expect(batch.appliedCount).toBe(3);
    expect(batch.remainingCount).toBe(2);

    let decisions: DuplicateDecisions = batch.decisions;
    for (const conflict of detection.conflicts) {
      if (!decisions[conflict.id]) {
        decisions = recordDecision(decisions, conflict.id, 'separate');
      }
    }
    expect(getDuplicateProgress(detection.conflicts, decisions)).toEqual({
      resolved: 5,
      total: 5,
    });
    const result = planDuplicateResolution({
      detection,
      decisions,
      existingItems: scenario.existingItems,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan.creates).toHaveLength(4);
      expect(result.plan.increments).toHaveLength(2);
      expect(
        result.plan.increments.find(item => item.targetId === 'tomatoes-new')
          ?.quantityDelta
      ).toBe(0.75);
    }
  });

  it.each(DUPLICATE_DEMO_SCENARIOS.map(scenario => [scenario.id]))(
    '%s can complete using all separate choices and restart cleanly',
    id => {
      const { scenario, detection } = detectScenario(id);
      const decisions: DuplicateDecisions = {};
      for (const conflict of detection.conflicts)
        decisions[conflict.id] = 'separate';
      const result = planDuplicateResolution({
        detection,
        decisions,
        existingItems: scenario.existingItems,
      });
      expect(result.ok).toBe(true);
      if (result.ok)
        expect(result.plan.creates).toHaveLength(scenario.incoming.length);
      expect(getDuplicateProgress(detection.conflicts, {})).toEqual({
        resolved: 0,
        total: detection.conflicts.length,
      });
    }
  );
});
