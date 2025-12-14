import { ReactNode } from 'react';

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '../../../../components/ui/dropdown-menu';
import { db } from '../../../../lib/instant';
import { clearCheckedItems } from '../../instant/clear-checked-items';
import { GroceryListItemWithRecipe } from '../../types';

type GroceryListDropdownMenuProps = {
  trigger: ReactNode;
  openRecipeSheet: () => void;
  onClearListPress: () => void;
  onSharePress: () => void;
  onDeleteOrLeave: () => void;
  items: GroceryListItemWithRecipe[];
  ownerId?: string;
};

export const GroceryListDropdownMenu = ({
  trigger,
  openRecipeSheet,
  onClearListPress,
  onSharePress,
  onDeleteOrLeave,
  items,
  ownerId,
}: GroceryListDropdownMenuProps) => {
  const { user } = db.useAuth();
  const checkedItems = items.filter(item => item.isChecked);
  const hasCheckedItems = checkedItems.length > 0;
  const isOwner = user?.id === ownerId;

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
          disabled={!items.length}
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
        <DropdownMenuItem
          destructive
          key="delete-or-leave"
          onSelect={onDeleteOrLeave}
        >
          <DropdownMenuItemTitle>
            {isOwner ? 'Delete List' : 'Leave List'}
          </DropdownMenuItemTitle>
          <DropdownMenuItemIcon
            ios={{
              name: isOwner ? 'trash' : 'rectangle.portrait.and.arrow.right',
            }}
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};
