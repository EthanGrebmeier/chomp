import { useMutation, useQueryClient } from '@tanstack/react-query';

import { MEAL_PLAN_QUERY_KEYS } from '../../meal-planner/query-keys';
import { deleteRecipe } from '../db/delete-recipe';
import { recipeQueryKeys } from '../query-keys';

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: MEAL_PLAN_QUERY_KEYS.all });
    },
  });
};
