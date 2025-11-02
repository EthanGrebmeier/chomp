import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MEAL_PLAN_QUERY_KEYS } from '../../meal-planner/query-keys';
import { updateRecipe } from '../db/update-recipe';
import { recipeQueryKeys } from '../query-keys';

export const useUpdateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRecipe,
    onSuccess: (_, variables) => {
      // Invalidate both the specific recipe and all recipes
      queryClient.invalidateQueries({
        queryKey: recipeQueryKeys.detail(variables.recipe.id),
      });
      queryClient.invalidateQueries({
        queryKey: recipeQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: MEAL_PLAN_QUERY_KEYS.all,
      });
    },
  });
};
