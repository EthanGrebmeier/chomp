import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteList } from '../db/delete-list';
import { queryKeys } from '../query-keys';

type DeleteListArgs = {
  listId: string;
};

export const useDeleteGroceryList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listId }: DeleteListArgs) => deleteList({ listId }),
    onSuccess: () => {
      // Invalidate and refetch grocery lists after successful deletion
      queryClient.invalidateQueries({ queryKey: queryKeys.base() });
    },
  });
};
