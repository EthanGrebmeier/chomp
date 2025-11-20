import * as Haptics from 'expo-haptics';
import { ReactNode } from 'react';
import * as DropdownMenu from 'zeego/dropdown-menu';

import { useClearCheckedItems } from '../../hooks/useClearCheckedItems';
import { useClearList } from '../../hooks/useClearList';
import { useGroceryItems } from '../../hooks/useGroceryItems';

type GroceryListDropdownMenuProps = {
  trigger: ReactNode;
  openRecipeSheet: () => void;
};

export const GroceryListDropdownMenu = ({
  trigger,
  openRecipeSheet,
}: GroceryListDropdownMenuProps) => {
  const { mutate: clearList } = useClearList();
  const { mutate: clearCheckedItems } = useClearCheckedItems();
  const { data: groceryListItems } = useGroceryItems();
  const checkedItems = groceryListItems?.filter(item => item.isChecked) ?? [];
  const hasCheckedItems = checkedItems.length > 0;
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        onClick={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      >
        {trigger}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item onSelect={openRecipeSheet} key="open-recipe-sheet">
          <DropdownMenu.ItemTitle>Add Recipe</DropdownMenu.ItemTitle>
          <DropdownMenu.ItemIcon ios={{ name: 'book' }} />
        </DropdownMenu.Item>
        <DropdownMenu.Item onSelect={clearList} destructive key="clear-list">
          <DropdownMenu.ItemTitle>Clear Grocery List</DropdownMenu.ItemTitle>
          <DropdownMenu.ItemIcon ios={{ name: 'trash' }} />
        </DropdownMenu.Item>
        <DropdownMenu.Item
          destructive
          key="delete-checked"
          onSelect={clearCheckedItems}
          disabled={!hasCheckedItems}
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
