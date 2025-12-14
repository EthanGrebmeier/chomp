import { useRecipes as useRecipesQuery } from '../instant/use-recipes';

export const useRecipes = () => {
  const { data, isLoading, error } = useRecipesQuery();

  // Transform data to match the expected format
  const recipes = data?.recipes ?? [];

  return {
    data: recipes,
    isLoading,
    error,
  };
};
