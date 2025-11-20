import { useMutation } from '@tanstack/react-query';

import { createListItem } from '../db/create-list-item';

export const useAddGroceryItem = () => {
  return useMutation({
    mutationFn: createListItem,
  });
};
