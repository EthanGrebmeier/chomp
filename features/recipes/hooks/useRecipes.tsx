import { useRecipes as useRecipesQuery } from '../instant/use-recipes';

export const useRecipes = () => {
  const { data, isLoading, error } = useRecipesQuery();

  return {
    data: data?.recipes ?? [],
    isLoading,
    error,
  };
};
