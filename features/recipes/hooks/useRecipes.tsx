import { useMemo } from 'react';

import { db } from '../../../lib/instant';
import { useRecipes as useRecipesQuery } from '../instant/use-recipes';

export const useRecipes = () => {
  const { user } = db.useAuth();
  const { data, isLoading, error } = useRecipesQuery();

  // Transform data to match the expected format and filter to only owned recipes
  const recipes = useMemo(() => {
    const allRecipes = data?.recipes ?? [];
    if (!user) return [];
    return allRecipes.filter(recipe => recipe.user?.id === user.id);
  }, [data?.recipes, user?.id]);

  return {
    data: recipes,
    isLoading,
    error,
  };
};
