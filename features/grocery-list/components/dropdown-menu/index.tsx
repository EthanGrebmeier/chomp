import { ReactNode } from 'react';

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '../../../../components/ui/dropdown-menu';
import { db } from '../../../../lib/instant';
import { useClearCheckedItems } from '../../instant/clear-checked-items';
import { GroceryListItemWithRecipe } from '../../types';

type GroceryListDropdownMenuProps = {
  trigger: ReactNode;
  onClearListPress: () => void;
  onSharePress: () => void;
  onDeleteOrLeave: () => void;
  items: GroceryListItemWithRecipe[];
  ownerId?: string;
};

export const GroceryListDropdownMenu = ({
  trigger,
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
  const { mutate: clearCheckedItems } = useClearCheckedItems({
    groceryItems: checkedItems,
  });

  return (
    <DropdownMenuRoot trigger={trigger}>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={onSharePress} key="share-list">
          <DropdownMenuItemTitle>Share</DropdownMenuItemTitle>
          <DropdownMenuItemIcon ios={{ name: 'square.and.arrow.up' }} />
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
