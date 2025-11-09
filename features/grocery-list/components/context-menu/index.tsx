import { ReactNode } from 'react';
import * as DropdownMenu from 'zeego/dropdown-menu';

import { useClearCheckedItems } from '../../hooks/useClearCheckedItems';
import { useClearList } from '../../hooks/useClearList';

type GroceryListContextMenuProps = {
  trigger: ReactNode;
};

export const GroceryListContextMenu = ({
  trigger,
}: GroceryListContextMenuProps) => {
  const { mutate: clearList } = useClearList();
  const { mutate: clearCheckedItems } = useClearCheckedItems();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item onSelect={clearList} destructive key="clear-list">
          <DropdownMenu.ItemTitle>Clear Grocery List</DropdownMenu.ItemTitle>
          <DropdownMenu.ItemIcon ios={{ name: 'trash' }} />
        </DropdownMenu.Item>
        <DropdownMenu.Item
          destructive
          key="delete-checked"
          onSelect={clearCheckedItems}
        >
          <DropdownMenu.ItemTitle>Clear Checked Items</DropdownMenu.ItemTitle>
          <DropdownMenu.ItemIcon
            ios={{
              name: 'trash',
            }}
          />
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
