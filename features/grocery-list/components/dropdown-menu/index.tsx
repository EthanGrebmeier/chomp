import { ReactNode } from 'react';

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '../../../../components/ui/dropdown-menu';
import { useClearCheckedItems } from '../../hooks/useClearCheckedItems';
import { useGroceryItems } from '../../hooks/useGroceryItems';

type GroceryListDropdownMenuProps = {
  trigger: ReactNode;
  openRecipeSheet: () => void;
  onClearListPress: () => void;
};

export const GroceryListDropdownMenu = ({
  trigger,
  openRecipeSheet,
  onClearListPress,
}: GroceryListDropdownMenuProps) => {
  const { mutate: clearCheckedItems } = useClearCheckedItems();
  const { data: groceryListItems } = useGroceryItems();
  const checkedItems = groceryListItems?.filter(item => item.isChecked) ?? [];
  const hasCheckedItems = checkedItems.length > 0;
  return (
    <DropdownMenuRoot trigger={trigger}>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={openRecipeSheet} key="open-recipe-sheet">
          <DropdownMenuItemTitle>Add Recipe</DropdownMenuItemTitle>
          <DropdownMenuItemIcon ios={{ name: 'book' }} />
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={onClearListPress}
          destructive
          key="clear-list"
          disabled={!groceryListItems?.length}
        >
          <DropdownMenuItemTitle>Clear Grocery List</DropdownMenuItemTitle>
          <DropdownMenuItemIcon ios={{ name: 'trash' }} />
        </DropdownMenuItem>
        <DropdownMenuItem
          destructive
          key="delete-checked"
          onSelect={clearCheckedItems}
          disabled={!hasCheckedItems}
        >
          <DropdownMenuItemTitle>Clear Checked Items</DropdownMenuItemTitle>
          <DropdownMenuItemIcon
            ios={{
              name: 'trash',
            }}
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};
