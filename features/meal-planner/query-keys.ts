export const MEAL_PLAN_QUERY_KEYS = {
  all: ['meal-plans'] as const,
  detail: (id: string) => ['meal-plans', id] as const,
  active: ['meal-plans', 'active'] as const,
} as const;
