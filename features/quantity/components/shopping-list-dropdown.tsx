import { View } from 'react-native';

import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '@/components/native-dropdown';
import { Pill } from '@/components/ui/pill';

export function ShoppingListDropdown({
  lists,
  selectedListId,
  onSelect,
}: {
  lists: { id: string; name: string }[];
  selectedListId: string;
  onSelect: (listId: string) => void;
}) {
  const selectedList = lists.find(list => list.id === selectedListId);

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger>
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Choose shopping list, current list: ${selectedList?.name ?? 'Shopping list'}`}
          className="min-h-11 justify-center"
        >
          <Pill hasValue>{selectedList?.name ?? 'Shopping list'}</Pill>
        </View>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {lists.length === 0 ? (
          <DropdownMenuItem key="empty" disabled>
            <DropdownMenuItemTitle>
              No shopping lists available
            </DropdownMenuItemTitle>
          </DropdownMenuItem>
        ) : null}
        {lists.map(list => (
          <DropdownMenuCheckboxItem
            key={list.id}
            value={list.id === selectedListId ? 'on' : 'off'}
            onValueChange={() => {
              if (list.id !== selectedListId) onSelect(list.id);
            }}
          >
            <DropdownMenuItemTitle>{list.name}</DropdownMenuItemTitle>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
}
