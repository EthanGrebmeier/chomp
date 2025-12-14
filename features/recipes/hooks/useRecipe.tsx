import { useRecipe as useRecipeQuery } from '../instant/use-recipe';

export const useRecipe = (recipeId: string | undefined) => {
  const { data, isLoading, error } = useRecipeQuery(recipeId);

  // Transform data to match the expected format
  const recipe = data?.recipes?.[0] ?? null;

  return {
    data: recipe,
    isLoading,
    error,
  };
};
