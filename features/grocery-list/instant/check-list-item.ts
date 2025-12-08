import { updateGroceryListItem } from './update-grocery-list-item';
type CheckListItemArgs = {
  itemId: string;
  isChecked: boolean;
};

export const checkListItem = ({ itemId, isChecked }: CheckListItemArgs) => {
  return updateGroceryListItem({
    itemId,
    item: { isChecked },
  });
};
