import { ReactNode } from 'react';

import { DropdownMenuGroup } from '../../../../components/native-dropdown';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '../../../../components/ui/dropdown-menu';
import { db } from '../../../../lib/instant';
import { useCanDeleteGroceryList } from '../../../grocery-lists/instant/useDeleteGroceryList';
import {
  filterCheckedItems,
  useClearCheckedItems,
} from '../../instant/clear-checked-items';
import { GroceryListItemWithRecipe } from '../../types';

type GroceryListDropdownMenuProps = {
  trigger: ReactNode;
  onClearListPress: () => void;
  onSharePress: () => void;
  onDeleteOrLeave: () => void;
  onEditNamePress: () => void;
  items: GroceryListItemWithRecipe[];
  ownerId?: string;
  showBulkSelectionAction?: boolean;
  isBulkSelectionModeActive?: boolean;
  onEnterBulkSelectionMode?: () => void;
  onExitBulkSelectionMode?: () => void;
};

export const GroceryListDropdownMenu = ({
  trigger,
  onClearListPress,
  onSharePress,
  onDeleteOrLeave,
  onEditNamePress,
  items,
  ownerId,
  showBulkSelectionAction = false,
  isBulkSelectionModeActive = false,
  onEnterBulkSelectionMode,
  onExitBulkSelectionMode,
}: GroceryListDropdownMenuProps) => {
  const { user } = db.useAuth();
  const checkedItems = filterCheckedItems(items);
  const hasCheckedItems = checkedItems.length > 0;
  const isOwner = user?.id === ownerId;
  const { mutate: clearCheckedItems } = useClearCheckedItems();
  const canDeleteList = useCanDeleteGroceryList();
  const showBulkSelectionMenuItem =
    showBulkSelectionAction &&
    (isBulkSelectionModeActive
      ? Boolean(onExitBulkSelectionMode)
      : Boolean(onEnterBulkSelectionMode));

  return (
    <DropdownMenuRoot trigger={trigger}>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={onSharePress} key="share-list">
          <DropdownMenuItemTitle>Share</DropdownMenuItemTitle>
          <DropdownMenuItemIcon ios={{ name: 'square.and.arrow.up' }} />
        </DropdownMenuItem>
        {isOwner && (
          <DropdownMenuItem onSelect={onEditNamePress} key="edit-name">
            <DropdownMenuItemTitle>Edit Name</DropdownMenuItemTitle>
            <DropdownMenuItemIcon ios={{ name: 'pencil' }} />
          </DropdownMenuItem>
        )}
        {showBulkSelectionMenuItem ? (
          <DropdownMenuItem
            onSelect={
              isBulkSelectionModeActive
                ? onExitBulkSelectionMode
                : onEnterBulkSelectionMode
            }
            key={
              isBulkSelectionModeActive
                ? 'exit-bulk-selection'
                : 'enter-bulk-selection'
            }
          >
            <DropdownMenuItemTitle>
              {isBulkSelectionModeActive
                ? 'Exit Bulk Select'
                : 'Select Items'}
            </DropdownMenuItemTitle>
            <DropdownMenuItemIcon
              ios={{
                name: isBulkSelectionModeActive
                  ? 'xmark.circle'
                  : 'checkmark.circle',
              }}
            />
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuGroup>
          <DropdownMenuItem
            destructive
            key="delete-checked"
            onSelect={() => clearCheckedItems({ itemIds: checkedItems })}
            disabled={!hasCheckedItems}
          >
            <DropdownMenuItemTitle>Clear Checked Items</DropdownMenuItemTitle>
            <DropdownMenuItemIcon
              ios={{
                name: 'checkmark.circle.badge.xmark',
              }}
            />
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={onClearListPress}
            destructive
            key="clear-list"
            disabled={!items.length}
          >
            <DropdownMenuItemTitle>Clear Grocery List</DropdownMenuItemTitle>
            <DropdownMenuItemIcon ios={{ name: 'xmark.circle' }} />
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem
            destructive
            disabled={isOwner && !canDeleteList}
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
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};
