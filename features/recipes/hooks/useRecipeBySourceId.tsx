import { useRecipeBySourceId as useRecipeBySourceIdQuery } from '../instant/use-recipe-by-source-id';

export const useRecipeBySourceId = (sourceRecipeId: string | undefined) => {
  const { data, isLoading, error } = useRecipeBySourceIdQuery(sourceRecipeId);

  return {
    data: data?.recipes[0] ?? null,
    isLoading,
    error,
  };
};
