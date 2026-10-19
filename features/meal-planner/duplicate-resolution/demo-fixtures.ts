import type { ExistingDuplicateItem, IncomingDuplicateItem } from './types';

export const DEMO_LIST_ID = 'demo-list';
export const DEMO_STORE_NAMES: Record<string, string> = {
  market: 'Neighborhood Market',
  produce: 'Farmers Market',
};

export type DuplicateDemoScenario = {
  id: string;
  label: string;
  description: string;
  mealName: string;
  incoming: IncomingDuplicateItem[];
  existingItems: ExistingDuplicateItem[];
};

const incoming = (
  sourceId: string,
  name: string,
  quantity: number,
  unit: string,
  overrides: Partial<IncomingDuplicateItem> = {}
): IncomingDuplicateItem => ({
  sourceId,
  sourceKind: 'recipe-ingredient',
  recipeId: 'demo-recipe',
  name,
  quantity,
  unit,
  storeId: 'market',
  category: 'Produce',
  ...overrides,
});

const existing = (
  id: string,
  name: string,
  quantity: number,
  unit: string,
  overrides: Partial<ExistingDuplicateItem> = {}
): ExistingDuplicateItem => ({
  id,
  listId: DEMO_LIST_ID,
  name,
  quantity,
  unit,
  storeId: 'market',
  category: 'Produce',
  isChecked: false,
  isDeleted: false,
  updatedAt: '2026-01-02T12:00:00.000Z',
  ...overrides,
});

const mixedIncoming = [
  incoming('tomatoes', 'Cherry tomatoes', 0.5, 'kg', {
    notes: 'For roasting',
  }),
  incoming('rice', 'Brown rice', 1, 'cup', { category: 'Pantry' }),
  incoming('spinach', 'Baby spinach', 1, 'bag', { storeId: 'produce' }),
  incoming(
    'oil',
    'Extra virgin olive oil from the small family-run grove',
    0.25,
    'cup',
    {
      category: 'Pantry',
      notes: 'Use the good finishing oil',
    }
  ),
  incoming('tomatoes-second', 'Cherry tomatoes', 0.25, 'kg', {
    notes: 'For the salad',
  }),
  incoming('lemon', 'Lemon', 1, 'each'),
  incoming('salt', 'Sea salt', 0.5, 'tsp', { category: 'Pantry' }),
];

const mixedExisting = [
  existing('tomatoes-new', 'Cherry tomatoes', 1, 'kg', {
    notes: 'Already planned for soup',
  }),
  existing('tomatoes-old', ' cherry  TOMATOES ', 2, 'kg', {
    updatedAt: '2026-01-01T12:00:00.000Z',
  }),
  existing('rice', 'Brown rice', 0.5, 'kg', { category: 'Pantry' }),
  existing('spinach', 'Baby spinach', 2, 'bag'),
  existing(
    'oil',
    'Extra virgin olive oil from the small family-run grove',
    0.5,
    'cup',
    {
      category: 'Pantry',
    }
  ),
  existing('lemon-checked', 'Lemon', 3, 'each', { isChecked: true }),
  existing('salt-deleted', 'Sea salt', 1, 'tsp', { isDeleted: true }),
];

export const DUPLICATE_DEMO_SCENARIOS: DuplicateDemoScenario[] = [
  {
    id: 'none',
    label: 'No duplicates',
    description: 'Checked and deleted matches do not need a decision.',
    mealName: 'Lemon pasta',
    incoming: [
      incoming('lemon', 'Lemon', 1, 'each'),
      incoming('pasta', 'Pasta', 250, 'g'),
    ],
    existingItems: [
      existing('checked-lemon', 'Lemon', 2, 'each', { isChecked: true }),
    ],
  },
  {
    id: 'single',
    label: 'One duplicate',
    description: 'A compatible item with fractional quantities.',
    mealName: 'Tomato soup',
    incoming: [incoming('tomato', 'Cherry tomatoes', 0.5, 'kg')],
    existingItems: [existing('tomato', 'Cherry tomatoes', 1.25, 'kg')],
  },
  {
    id: 'mixed',
    label: 'Five mixed duplicates',
    description:
      'Unit/store mismatches, repeated ingredients, and several existing matches.',
    mealName: 'Roasted vegetable bowls',
    incoming: mixedIncoming,
    existingItems: mixedExisting,
  },
  {
    id: 'conflict-states',
    label: 'Every conflict type',
    description:
      'Matching pairs, different quantities, stores, units, both units and stores, and an unassigned store.',
    mealName: 'Conflict review sampler',
    incoming: [
      incoming('same', 'Carrots', 1, 'kg'),
      incoming('quantity', 'Potatoes', 0.5, 'kg'),
      incoming('store', 'Apples', 1, 'kg', { storeId: 'produce' }),
      incoming('unit', 'Rice', 1, 'cup'),
      incoming('unit-store', 'Flour', 2, 'cup', { storeId: 'produce' }),
      incoming('no-store', 'Milk', 1, 'bottle', { storeId: null }),
    ],
    existingItems: [
      existing('same', 'Carrots', 1, 'kg'),
      existing('quantity', 'Potatoes', 2, 'kg'),
      existing('store', 'Apples', 2, 'kg'),
      existing('unit', 'Rice', 0.5, 'kg'),
      existing('unit-store', 'Flour', 1, 'kg'),
      existing('no-store', 'Milk', 2, 'bottle'),
    ],
  },
  {
    id: 'many',
    label: '20 duplicates',
    description:
      'A longer batch with incompatible items left for individual review.',
    mealName: 'Meals for the week',
    incoming: Array.from({ length: 20 }, (_, index) =>
      incoming(
        `source-${index}`,
        `Weeknight ingredient ${index + 1}`,
        0.5,
        'cup',
        {
          sourceKind: index === 19 ? 'meal-plan-item' : 'recipe-ingredient',
          notes: index === 3 ? 'Keep this separate if you prefer' : null,
        }
      )
    ),
    existingItems: Array.from({ length: 20 }, (_, index) =>
      existing(
        `existing-${index}`,
        `Weeknight ingredient ${index + 1}`,
        index % 3 === 0 ? 0.5 : 1.5,
        index % 7 === 0 ? 'g' : 'cup',
        {
          storeId: index % 9 === 0 ? 'produce' : 'market',
        }
      )
    ),
  },
];
