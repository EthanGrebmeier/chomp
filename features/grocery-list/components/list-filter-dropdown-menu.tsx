import { ListFilter } from 'lucide-react-native';

import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../../../components/native-dropdown';
import { Icon } from '../../../components/ui/icon';

type GroupByValue = 'category' | 'none' | 'recipe' | 'store';
type SortByValue = 'name' | 'recent';

type ListFilterDropdownMenuProps = {
  groupBy: GroupByValue;
  sortBy: SortByValue;
  onGroupByChange: (value: GroupByValue) => void;
  onSortByChange: (value: SortByValue) => void;
};

export const ListFilterDropdownMenu = ({
  groupBy,
  sortBy,
  onGroupByChange,
  onSortByChange,
}: ListFilterDropdownMenuProps) => {
  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger>
        <Icon as={ListFilter} size={24} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger key="group-by-submenu">
            <DropdownMenuItemTitle>Group By</DropdownMenuItemTitle>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuCheckboxItem
              key="group-none"
              value={groupBy === 'none' ? 'on' : 'off'}
              onValueChange={() => onGroupByChange('none')}
            >
              <DropdownMenuItemTitle>None</DropdownMenuItemTitle>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              key="group-category"
              value={groupBy === 'category' ? 'on' : 'off'}
              onValueChange={() => onGroupByChange('category')}
            >
              <DropdownMenuItemTitle>Category</DropdownMenuItemTitle>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              key="group-recipe"
              value={groupBy === 'recipe' ? 'on' : 'off'}
              onValueChange={() => onGroupByChange('recipe')}
            >
              <DropdownMenuItemTitle>Recipe</DropdownMenuItemTitle>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              key="group-store"
              value={groupBy === 'store' ? 'on' : 'off'}
              onValueChange={() => onGroupByChange('store')}
            >
              <DropdownMenuItemTitle>Store</DropdownMenuItemTitle>
            </DropdownMenuCheckboxItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger key="sort-by-submenu">
            <DropdownMenuItemTitle>Sort By</DropdownMenuItemTitle>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuCheckboxItem
              key="sort-recent"
              value={sortBy === 'recent' ? 'on' : 'off'}
              onValueChange={() => onSortByChange('recent')}
            >
              <DropdownMenuItemTitle>Recent</DropdownMenuItemTitle>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              key="sort-name"
              value={sortBy === 'name' ? 'on' : 'off'}
              onValueChange={() => onSortByChange('name')}
            >
              <DropdownMenuItemTitle>Alphabetical</DropdownMenuItemTitle>
            </DropdownMenuCheckboxItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};
