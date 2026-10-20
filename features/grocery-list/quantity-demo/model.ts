import { format } from 'date-fns';

import { parseMealPlanDate } from '@/features/meal-planner/utils/meal-plan-date-format';

/** Demo-only snapshots. No production IDs, queries, or mutation helpers. */
export type Contribution = {
  id: string;
  label: string; // Recipe name, "Meal plan", or "Extra"; never the grocery item name.
  amount: string;
  origin: 'manual' | 'scheduled' | 'planned' | 'recipe';
  note?: string; // Ingredient or planned-item note, not the grocery item's shopping note.
  plannedDate?: string; // Meal-plan date (yyyy-MM-dd), when plan-backed.
  mealTag?: string;
};

export type DemoItem = {
  id: string;
  name: string;
  unit: string;
  store: string;
  category?: string;
  note: string;
  status: 'active' | 'checked' | 'deleted';
  entries: Contribution[];
};

export function contributionSourceDetail(entry: Contribution): string {
  if (entry.origin === 'scheduled' || entry.origin === 'planned') {
    const meal = entry.mealTag?.toLocaleLowerCase();
    const date = entry.plannedDate
      ? format(parseMealPlanDate(entry.plannedDate), 'MMMM do')
      : undefined;
    if (meal && date) return `Planned for ${meal} on ${date}`;
    if (meal) return `Planned for ${meal}`;
    if (date) return `Planned for ${date}`;
    return 'Planned';
  }
  return entry.origin === 'recipe' ? 'Added from recipe' : 'Added manually';
}

export function parseAmount(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(\.\d*)?$/.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function totalAmount(entries: Contribution[]): number | null {
  let total = 0;
  for (const entry of entries) {
    const amount = parseAmount(entry.amount);
    if (amount === null) return null;
    total += amount;
  }
  return Number.isFinite(total) ? total : null;
}

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(
    amount
  );
}

export function createDemoItems(): DemoItem[] {
  return [
    {
      id: 'mixed',
      name: 'Apples',
      unit: 'each',
      store: 'Whole Foods',
      note: 'Choose firm apples',
      status: 'active',
      entries: [
        {
          id: 'pie',
          label: 'Apple pie',
          amount: '2',
          origin: 'scheduled',
          note: 'Granny Smith preferred',
          plannedDate: '2026-10-23',
          mealTag: 'Dinner',
        },
        {
          id: 'butter',
          label: 'Apple butter',
          amount: '1',
          origin: 'recipe',
        },
        {
          id: 'extra',
          label: 'Extra',
          amount: '2',
          origin: 'manual',
        },
      ],
    },
    {
      id: 'manual',
      name: 'Bananas',
      unit: 'each',
      store: 'Whole Foods',
      note: '',
      status: 'active',
      entries: [
        {
          id: 'bananas',
          label: 'Extra',
          amount: '6',
          origin: 'manual',
        },
      ],
    },
    {
      id: 'repeated',
      name: 'Tomatoes',
      unit: 'g',
      store: 'Farmers market',
      note: 'Ripe, but not too soft',
      status: 'active',
      entries: [
        {
          id: 'sauce-1',
          label: 'Slow-roasted tomato sauce with garlic and fresh garden herbs',
          amount: '250',
          origin: 'scheduled',
          note: 'Choose ripe plum tomatoes',
          plannedDate: '2026-10-23',
          mealTag: 'Dinner',
        },
        {
          id: 'sauce-2',
          label: 'Slow-roasted tomato sauce with garlic and fresh garden herbs',
          amount: '125.5',
          origin: 'scheduled',
          plannedDate: '2026-10-25',
          mealTag: 'Dinner',
        },
        {
          id: 'lunch',
          label: 'Meal plan',
          amount: '100',
          origin: 'planned',
          note: 'For lunchboxes',
          plannedDate: '2026-10-24',
          mealTag: 'Lunch',
        },
        {
          id: 'zero',
          label: 'Extra',
          amount: '0',
          origin: 'manual',
        },
      ],
    },
    {
      id: 'different-unit',
      name: 'Apples',
      unit: 'g',
      store: 'Whole Foods',
      note: 'For Sunday’s crumble',
      status: 'active',
      entries: [
        {
          id: 'crumble',
          label: 'Apple crumble',
          amount: '500',
          origin: 'scheduled',
          plannedDate: '2026-10-25',
          mealTag: 'Dinner',
        },
      ],
    },
    {
      id: 'empty',
      name: 'Lemons',
      unit: 'each',
      store: 'No store',
      note: '',
      status: 'active',
      entries: [
        {
          id: 'unspecified',
          label: 'Extra',
          amount: '',
          origin: 'manual',
        },
      ],
    },
    ...(['checked', 'deleted'] as const).map(status => ({
      id: status,
      name: 'Apples',
      unit: 'each',
      store: 'Whole Foods',
      note: 'Granny Smith apples',
      status,
      entries: [
        {
          id: `${status}-entry`,
          label: 'Apple pie',
          amount: '3',
          origin: 'scheduled' as const,
          plannedDate: '2026-10-16',
          mealTag: 'Dinner',
        },
      ],
    })),
  ];
}
