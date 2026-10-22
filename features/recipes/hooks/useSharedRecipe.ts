import { useSharedRecipe as useSharedRecipeQuery } from '../instant/use-shared-recipe';

export const useSharedRecipe = (recipeId: string | undefined) => {
  const { data, isLoading, error } = useSharedRecipeQuery(recipeId);

  return {
    data: data?.recipes[0] ?? null,
    isLoading,
    error,
  };
};
