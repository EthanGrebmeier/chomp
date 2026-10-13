import { describe, expect, it } from 'vitest';

import { detectDuplicates } from './detection';
import { DEMO_LIST_ID, DUPLICATE_DEMO_SCENARIOS } from './demo-fixtures';
import { getDemoIncrementPreviewQuantity } from './demo-presentation';
import type { DuplicateDecisions } from './types';

const scenario = DUPLICATE_DEMO_SCENARIOS.find(item => item.id === 'mixed')!;
const detection = detectDuplicates({
  listId: DEMO_LIST_ID,
  incoming: scenario.incoming,
  existingItems: scenario.existingItems,
});
const firstTomato = detection.conflicts.find(
  item => item.incoming.sourceId === 'tomatoes'
)!;
const secondTomato = detection.conflicts.find(
  item => item.incoming.sourceId === 'tomatoes-second'
)!;

const preview = (conflict = secondTomato, decisions: DuplicateDecisions = {}) =>
  getDemoIncrementPreviewQuantity({
    conflict,
    detection,
    decisions,
    existingItems: scenario.existingItems,
  });

describe('demo combined-quantity preview', () => {
  it('includes prior staged increments targeting the same existing item', () => {
    expect(preview(secondTomato, { [firstTomato.id]: 'increment' })).toBe(1.75);
  });

  it('does not double-count the current increment when revisiting it', () => {
    expect(
      preview(secondTomato, {
        [firstTomato.id]: 'increment',
        [secondTomato.id]: 'increment',
      })
    ).toBe(1.75);
    expect(
      preview(firstTomato, {
        [firstTomato.id]: 'increment',
        [secondTomato.id]: 'increment',
      })
    ).toBe(1.75);
  });

  it('reflects other answers revised to separate without counting unresolved items', () => {
    expect(preview(secondTomato, { [firstTomato.id]: 'separate' })).toBe(1.25);
    expect(preview(firstTomato)).toBe(1.5);
  });

  it('previews replacing the current separate choice without mutating decisions', () => {
    const decisions: DuplicateDecisions = {
      [firstTomato.id]: 'increment',
      [secondTomato.id]: 'separate',
    };
    expect(preview(secondTomato, decisions)).toBe(1.75);
    expect(decisions[secondTomato.id]).toBe('separate');
  });

  it('returns no combined quantity for incompatible items', () => {
    const rice = detection.conflicts.find(
      item => item.incoming.sourceId === 'rice'
    )!;
    expect(preview(rice)).toBeNull();
  });
});
