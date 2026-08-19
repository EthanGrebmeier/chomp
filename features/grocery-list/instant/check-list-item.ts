import { updateGroceryItemsCheckedState } from './update-grocery-item-only';

type CheckListItemArgs = {
  itemId: string;
  isChecked: boolean;
};

export const checkListItem = ({
  itemId,
  isChecked,
}: CheckListItemArgs): Promise<void> => {
  return updateGroceryItemsCheckedState([
    {
      itemId,
      isChecked,
    },
  ]);
};
