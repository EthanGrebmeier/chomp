import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner-native';

import { updateRecipe } from '../instant/update-recipe';

export const useUpdateRecipe = () => {
  return useMutation({
    networkMode: 'always',
    mutationFn: updateRecipe,
    onSuccess: () => toast.success('Recipe saved'),
    // No need to invalidate queries - InstantDB updates in real-time
  });
};
