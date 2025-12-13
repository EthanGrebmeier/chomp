import { ReactNode } from 'react';

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '../../../../components/ui/dropdown-menu';
import { clearCheckedItems } from '../../instant/clear-checked-items';
import { useGroceryListItems } from '../../instant/use-grocery-list-items';

type GroceryListDropdownMenuProps = {
  trigger: ReactNode;
  openRecipeSheet: () => void;
  onClearListPress: () => void;
  onSharePress: () => void;
  listId: string;
};

export const GroceryListDropdownMenu = ({
  trigger,
  openRecipeSheet,
  onClearListPress,
  onSharePress,
  listId,
}: GroceryListDropdownMenuProps) => {
  const { data: groceryListItems } = useGroceryListItems(listId);
  const checkedItems =
    groceryListItems?.grocery_items.filter(item => item.isChecked) ?? [];
  const hasCheckedItems = checkedItems.length > 0;

  return (
    <DropdownMenuRoot trigger={trigger}>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={onSharePress} key="share-list">
          <DropdownMenuItemTitle>Share</DropdownMenuItemTitle>
          <DropdownMenuItemIcon ios={{ name: 'square.and.arrow.up' }} />
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={openRecipeSheet} key="open-recipe-sheet">
          <DropdownMenuItemTitle>Add Recipe</DropdownMenuItemTitle>
          <DropdownMenuItemIcon ios={{ name: 'book' }} />
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={onClearListPress}
          destructive
          key="clear-list"
          disabled={!groceryListItems?.grocery_items.length}
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
