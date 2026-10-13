import { describe, expect, it } from 'vitest';

import {
  applyChoiceToRemaining,
  detectDuplicates,
  getDuplicateProgress,
  planDuplicateResolution,
  projectRecipeDuplicateInputs,
  projectStandaloneDuplicateInput,
  recordDecision,
} from '..';
import type {
  DuplicateDecisions,
  ExistingDuplicateItem,
  IncomingDuplicateItem,
} from '../types';

const incomingItem = (
  overrides: Partial<IncomingDuplicateItem> = {}
): IncomingDuplicateItem => ({
  sourceId: 'source-1',
  sourceKind: 'recipe-ingredient',
  recipeId: 'recipe-1',
  name: 'Tomato',
  quantity: 0.5,
  unit: 'kg',
  ...overrides,
});
const existingItem = (
  overrides: Partial<ExistingDuplicateItem> = {}
): ExistingDuplicateItem => ({
  id: 'target-1',
  listId: 'list-1',
  name: 'Tomato',
  quantity: 2,
  unit: 'kg',
  isChecked: false,
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});
const detect = (
  incoming = [incomingItem()],
  existingItems = [existingItem()]
) => detectDuplicates({ listId: 'list-1', incoming, existingItems });
const errorCodes = (result: ReturnType<typeof planDuplicateResolution>) =>
  result.ok ? [] : result.errors.map(error => error.code);

const freezeDeep = <T>(value: T): T => {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    Object.values(value).forEach(freezeDeep);
  }
  return value;
};

describe('duplicate detection', () => {
  it('prompts exact matches and normalizes name/unit casing and whitespace', () => {
    const detection = detect(
      [incomingItem({ name: '  CHERRY   Tomato ', unit: ' KG ' })],
      [existingItem({ name: 'cherry tomato' })]
    );
    expect(detection.conflicts).toMatchObject([
      { id: 'source-1', targetId: 'target-1', canIncrement: true },
    ]);
    expect(detection.nonConflicting).toEqual([]);
  });

  it('ignores checked, deleted and other-list items without fuzzy matching', () => {
    const incoming = [
      incomingItem(),
      incomingItem({ sourceId: 'source-2', name: 'Tomatoes' }),
    ];
    const detection = detect(incoming, [
      existingItem({ id: 'checked', isChecked: true }),
      existingItem({ id: 'deleted', isDeleted: true }),
      existingItem({ id: 'other', listId: 'list-2' }),
    ]);
    expect(detection.conflicts).toEqual([]);
    expect(detection.nonConflicting).toEqual(incoming);
    expect(detect([incomingItem({ name: 'Tomatoes' })]).conflicts).toEqual([]);
  });

  it.each([
    [{ unit: 'g' }, {}, 'unit'],
    [{ storeId: 'store-1' }, { storeId: 'store-2' }, 'store'],
    [
      { unit: 'g', storeId: 'store-1' },
      { storeId: 'store-2' },
      'unit-and-store',
    ],
    [{ unit: 'kilograms' }, {}, 'unit'],
  ] as const)(
    'blocks incompatible units/stores with an explanation',
    (incoming, existing, reason) => {
      expect(
        detect([incomingItem(incoming)], [existingItem(existing)]).conflicts[0]
      ).toMatchObject({
        targetId: null,
        canIncrement: false,
        incrementBlockedReason: reason,
      });
    }
  );

  it('matches absent stores and store IDs, but ignores categories and notes for eligibility', () => {
    expect(
      detect(
        [incomingItem({ storeId: null, category: 'Produce' })],
        [existingItem({ notes: 'old', category: 'Other' })]
      ).conflicts[0].canIncrement
    ).toBe(true);
    expect(
      detect(
        [incomingItem({ storeId: 'same' })],
        [existingItem({ storeId: 'same' })]
      ).conflicts[0].canIncrement
    ).toBe(true);
    expect(
      detect(
        [incomingItem({ storeId: 'SAME' })],
        [existingItem({ storeId: 'same' })]
      ).conflicts[0].canIncrement
    ).toBe(false);
  });

  it('selects newest eligible target then lexical ID, not newest incompatible item', () => {
    const detection = detect(undefined, [
      existingItem({ id: 'z', updatedAt: '2026-02-01T00:00:00Z' }),
      existingItem({ id: 'b', updatedAt: '2026-03-01T00:00:00Z' }),
      existingItem({ id: 'a', updatedAt: '2026-03-01T00:00:00Z' }),
      existingItem({
        id: 'incompatible',
        unit: 'g',
        updatedAt: '2026-04-01T00:00:00Z',
      }),
    ]);
    expect(detection.conflicts[0].targetId).toBe('a');
    expect(
      detect(undefined, [
        existingItem({ id: 'b', updatedAt: 'invalid' }),
        existingItem({ id: 'a', updatedAt: null }),
      ]).conflicts[0].targetId
    ).toBe('a');
  });

  it('preserves incoming order and identities; incoming duplicates do not match each other', () => {
    const incoming = [
      incomingItem({ sourceId: 'b' }),
      incomingItem({ sourceId: 'a' }),
    ];
    expect(detect(incoming).conflicts.map(conflict => conflict.id)).toEqual([
      'b',
      'a',
    ]);
    expect(detect(incoming, []).nonConflicting).toEqual(incoming);
  });

  it('takes detached snapshots without mutating source inputs', () => {
    const incoming = freezeDeep([incomingItem()]);
    const existingItems = [existingItem()];
    const detection = detect(incoming, existingItems);
    existingItems[0].quantity = 100;
    expect(detection.conflicts[0].candidates[0].quantity).toBe(2);
    expect(detection.incoming[0]).not.toBe(incoming[0]);
    expect(detection.conflicts[0].candidates[0]).not.toBe(existingItems[0]);
  });

  it.each([0, -1, NaN, Infinity])(
    'rejects invalid incoming quantity %s',
    quantity => {
      expect(() => detect([incomingItem({ quantity })])).toThrow();
    }
  );

  it('rejects empty names, duplicate IDs, and negative existing quantities', () => {
    expect(() => detect([incomingItem({ name: ' ' })])).toThrow();
    expect(() => detect([incomingItem(), incomingItem()])).toThrow();
    expect(() => detect(undefined, [existingItem(), existingItem()])).toThrow();
    expect(() => detect(undefined, [existingItem({ quantity: -1 })])).toThrow();
  });
});

describe('resolution planning', () => {
  it('plans no-conflict creates including repeated names without aggregation', () => {
    const incoming = [incomingItem(), incomingItem({ sourceId: 'source-2' })];
    const detection = freezeDeep(detect(incoming, []));
    expect(
      planDuplicateResolution({ detection, decisions: {}, existingItems: [] })
    ).toEqual({ ok: true, plan: { creates: incoming, increments: [] } });
  });

  it('accumulates deltas with attribution and preserves separate incoming metadata', () => {
    const incoming = [
      incomingItem(),
      incomingItem({ sourceId: 'source-2', quantity: 1.25 }),
      incomingItem({
        sourceId: 'source-3',
        notes: 'keep',
        category: 'Fresh',
        storeId: 'other',
      }),
    ];
    const existingItems = freezeDeep([
      existingItem({ notes: 'existing note' }),
    ]);
    const detection = freezeDeep(detect(incoming, existingItems));
    const decisions = freezeDeep({
      'source-1': 'increment',
      'source-2': 'increment',
      'source-3': 'separate',
    } as const);
    expect(
      planDuplicateResolution({ detection, decisions, existingItems })
    ).toEqual({
      ok: true,
      plan: {
        creates: [incoming[2]],
        increments: [
          {
            targetId: 'target-1',
            quantityDelta: 1.75,
            sources: incoming.slice(0, 2),
          },
        ],
      },
    });
    expect(existingItems[0].quantity).toBe(2);
    expect(existingItems[0].notes).toBe('existing note');
  });

  it('returns no partial plan for missing, unknown, or invalid choices', () => {
    const detection = detect();
    expect(
      errorCodes(
        planDuplicateResolution({
          detection,
          decisions: {},
          existingItems: [existingItem()],
        })
      )
    ).toContain('unresolved');
    expect(
      errorCodes(
        planDuplicateResolution({
          detection,
          decisions: { unknown: 'separate', 'source-1': 'separate' },
          existingItems: [existingItem()],
        })
      )
    ).toContain('invalid-decision');
    expect(
      errorCodes(
        planDuplicateResolution({
          detection,
          decisions: { 'source-1': 'oops' } as unknown as DuplicateDecisions,
          existingItems: [existingItem()],
        })
      )
    ).toContain('invalid-decision');
    const incompatible = detect([incomingItem({ unit: 'g' })]);
    expect(
      errorCodes(
        planDuplicateResolution({
          detection: incompatible,
          decisions: { 'source-1': 'increment' },
          existingItems: [existingItem()],
        })
      )
    ).toContain('invalid-decision');
  });

  it.each([
    { quantity: 3 },
    { isChecked: true },
    { isDeleted: true },
    { unit: 'g' },
    { storeId: 'other' },
    { name: 'Potato' },
    { listId: 'list-2' },
    { notes: 'changed' },
  ])('rejects stale reviewed targets: %j', changed => {
    expect(
      errorCodes(
        planDuplicateResolution({
          detection: detect(),
          decisions: { 'source-1': 'increment' },
          existingItems: [existingItem(changed)],
        })
      )
    ).toContain('stale-input');
  });

  it('rejects disappeared or newly selected targets and newly introduced duplicates', () => {
    expect(
      errorCodes(
        planDuplicateResolution({
          detection: detect(),
          decisions: { 'source-1': 'increment' },
          existingItems: [],
        })
      )
    ).toContain('stale-input');
    expect(
      errorCodes(
        planDuplicateResolution({
          detection: detect(),
          decisions: { 'source-1': 'increment' },
          existingItems: [
            existingItem(),
            existingItem({ id: 'new', updatedAt: '2026-04-01T00:00:00Z' }),
          ],
        })
      )
    ).toContain('stale-input');
    expect(
      errorCodes(
        planDuplicateResolution({
          detection: detect(undefined, []),
          decisions: {},
          existingItems: [existingItem()],
        })
      )
    ).toContain('stale-input');
  });

  it('converts invalid fresh inputs and overflowing totals into invalid-input results', () => {
    expect(
      errorCodes(
        planDuplicateResolution({
          detection: detect(),
          decisions: { 'source-1': 'separate' },
          existingItems: [existingItem({ quantity: Infinity })],
        })
      )
    ).toContain('invalid-input');
    const incoming = [incomingItem({ quantity: Number.MAX_VALUE })];
    const existingItems = [existingItem({ quantity: Number.MAX_VALUE })];
    expect(
      errorCodes(
        planDuplicateResolution({
          detection: detect(incoming, existingItems),
          decisions: { 'source-1': 'increment' },
          existingItems,
        })
      )
    ).toContain('invalid-input');
  });

  it('does not treat inherited object properties as choices', () => {
    const detection = detect([incomingItem({ sourceId: 'toString' })]);
    expect(
      errorCodes(
        planDuplicateResolution({
          detection,
          decisions: {},
          existingItems: [existingItem()],
        })
      )
    ).toContain('unresolved');
  });
});

describe('session helpers', () => {
  const conflicts = detect([
    incomingItem({ sourceId: 'a' }),
    incomingItem({ sourceId: 'b' }),
    incomingItem({ sourceId: 'c', unit: 'g' }),
  ]).conflicts;

  it('records and revises choices immutably for Back/review editing; reset is an empty map', () => {
    const original = freezeDeep({ a: 'increment' } as const);
    const revised = recordDecision(original, 'a', 'separate');
    expect(revised).toEqual({ a: 'separate' });
    expect(original).toEqual({ a: 'increment' });
    expect(getDuplicateProgress(conflicts, revised)).toEqual({
      resolved: 1,
      total: 3,
    });
    expect(getDuplicateProgress(conflicts, {})).toEqual({
      resolved: 0,
      total: 3,
    });
    expect(getDuplicateProgress([], {})).toEqual({ resolved: 0, total: 0 });
  });

  it('bulk increments current and compatible unresolved conflicts, preserving previous answers', () => {
    const decisions = freezeDeep({ a: 'separate' } as const);
    expect(
      applyChoiceToRemaining({
        conflicts,
        decisions,
        choice: 'increment',
        currentConflictId: 'b',
      })
    ).toEqual({
      decisions: { a: 'separate', b: 'increment' },
      appliedCount: 1,
      remainingCount: 1,
    });
    expect(decisions).toEqual({ a: 'separate' });
  });

  it('bulk separate resolves incompatible items but keeps previous other answers', () => {
    expect(
      applyChoiceToRemaining({
        conflicts,
        decisions: { a: 'increment' },
        choice: 'separate',
        currentConflictId: 'b',
      })
    ).toEqual({
      decisions: { a: 'increment', b: 'separate', c: 'separate' },
      appliedCount: 2,
      remainingCount: 0,
    });
  });

  it('can revise current choice while preserving others and ignores an unknown current ID', () => {
    expect(
      applyChoiceToRemaining({
        conflicts,
        decisions: { a: 'separate', b: 'separate' },
        choice: 'increment',
        currentConflictId: 'a',
      })
    ).toEqual({
      decisions: { a: 'increment', b: 'separate' },
      appliedCount: 1,
      remainingCount: 1,
    });
    expect(
      applyChoiceToRemaining({
        conflicts,
        decisions: {},
        choice: 'separate',
        currentConflictId: 'missing',
      })
    ).toEqual({ decisions: {}, appliedCount: 0, remainingCount: 3 });
  });

  it('progress does not count unknown or incompatible decisions', () => {
    expect(
      getDuplicateProgress(conflicts, { unknown: 'separate', c: 'increment' })
    ).toEqual({ resolved: 0, total: 3 });
  });
});

describe('projection adapter', () => {
  it('uses selected snapshots, servings, quantity overrides, and effective default stores', () => {
    const input = freezeDeep({
      recipeId: 'recipe',
      servings: 3,
      sourceIngredients: [
        { id: 'a', name: 'Tomato', quantity: 2, unit: 'kg' },
        { id: 'b', name: 'Rice', quantity: 1, unit: 'cup' },
        { id: 'c', name: 'Salt', quantity: 1, unit: 'tsp' },
      ],
      snapshotRows: [
        {
          sourceRecipeIngredientId: 'a',
          name: 'Fresh tomato',
          quantity: 2,
          unit: 'kg',
          isSelected: true,
          isQuantityOverridden: false,
        },
        {
          sourceRecipeIngredientId: 'b',
          name: 'Rice',
          quantity: 0.25,
          unit: 'cup',
          isSelected: true,
          isQuantityOverridden: true,
          store: { id: 'custom' },
        },
        {
          sourceRecipeIngredientId: 'c',
          name: 'Salt',
          quantity: 1,
          unit: 'tsp',
          isSelected: false,
          isQuantityOverridden: false,
        },
      ],
      defaultStore: { id: 'default', name: 'Default' },
    });
    expect(projectRecipeDuplicateInputs(input)).toMatchObject([
      {
        sourceId: 'a',
        sourceKind: 'recipe-ingredient',
        name: 'Fresh tomato',
        quantity: 6,
        storeId: 'default',
        recipeId: 'recipe',
      },
      { sourceId: 'b', quantity: 0.25, storeId: 'custom' },
    ]);
    expect(projectRecipeDuplicateInputs(input)).toHaveLength(2);
  });

  it('uses one serving for nonpositive servings and adapts standalone items', () => {
    expect(
      projectRecipeDuplicateInputs({
        recipeId: 'recipe',
        servings: 0,
        sourceIngredients: [
          { id: 'a', name: 'Tomato', quantity: 2, unit: 'kg' },
        ],
        snapshotRows: [],
      })[0]
    ).toMatchObject({ sourceId: 'a', quantity: 2, storeId: null });
    const item = freezeDeep({
      sourceId: 'item',
      name: 'Apple',
      quantity: 2,
      unit: 'each',
    });
    expect(
      projectStandaloneDuplicateInput(item, { id: 'default' })
    ).toMatchObject({
      ...item,
      sourceKind: 'meal-plan-item',
      storeId: 'default',
    });
    expect(
      projectStandaloneDuplicateInput(
        { ...item, storeId: 'explicit' },
        { id: 'default' }
      ).storeId
    ).toBe('explicit');
  });
});
