export const MEAL_PLAN_QUERY_KEYS = {
  all: ['meal-plans'] as const,
  detail: (id: string) => ['meal-plans', id] as const,
} as const;
