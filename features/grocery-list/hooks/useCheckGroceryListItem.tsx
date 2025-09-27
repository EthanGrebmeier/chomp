import { useMutation } from '@tanstack/react-query';
import { checkListItem } from '../db/check-list-item';

export const useCheckGroceryItem = () => {
  return useMutation({
    mutationFn: checkListItem,
  });
};
