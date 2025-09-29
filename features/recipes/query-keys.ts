export const recipeQueryKeys = {
  all: ['recipes'] as const,
  lists: () => [...recipeQueryKeys.all, 'list'] as const,
  list: (filters: string) => [...recipeQueryKeys.lists(), { filters }] as const,
  details: () => [...recipeQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...recipeQueryKeys.details(), id] as const,
} as const;
