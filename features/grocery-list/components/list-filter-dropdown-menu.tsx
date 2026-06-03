import { ListFilter } from 'lucide-react-native';

import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../../../components/native-dropdown';
import { Icon } from '../../../components/ui/icon';
import { GroceryListGroupBy, GroceryListSortBy } from '../types';

type GroupByValue = GroceryListGroupBy;
type SortByValue = GroceryListSortBy;

type ListFilterDropdownMenuProps = {
  groupBy: GroupByValue;
  sortBy: SortByValue;
  hasEnabledGroupings: boolean;
  onGroupByChange: (value: GroupByValue) => void;
  onSortByChange: (value: SortByValue) => void;
  onOpenAllGroupings: () => void;
  onCollapseAllGroupings: () => void;
};

export const ListFilterDropdownMenu = ({
  groupBy,
  sortBy,
  hasEnabledGroupings,
  onGroupByChange,
  onSortByChange,
  onOpenAllGroupings,
  onCollapseAllGroupings,
}: ListFilterDropdownMenuProps) => {
  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger>
        <Icon as={ListFilter} size={24} hitSlop={14} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
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
            <DropdownMenuCheckboxItem
              key="sort-category"
              value={sortBy === 'category' ? 'on' : 'off'}
              onValueChange={() => onSortByChange('category')}
            >
              <DropdownMenuItemTitle>Category</DropdownMenuItemTitle>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              key="sort-recipe"
              value={sortBy === 'recipe' ? 'on' : 'off'}
              onValueChange={() => onSortByChange('recipe')}
            >
              <DropdownMenuItemTitle>Recipe</DropdownMenuItemTitle>
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              key="sort-store"
              value={sortBy === 'store' ? 'on' : 'off'}
              onValueChange={() => onSortByChange('store')}
            >
              <DropdownMenuItemTitle>Store</DropdownMenuItemTitle>
            </DropdownMenuCheckboxItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
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
        <DropdownMenuGroup>
          <DropdownMenuItem
            key="open-all-groupings"
            disabled={!hasEnabledGroupings}
            onSelect={onOpenAllGroupings}
          >
            <DropdownMenuItemTitle>Open Groupings</DropdownMenuItemTitle>
          </DropdownMenuItem>
          <DropdownMenuItem
            key="collapse-all-groupings"
            disabled={!hasEnabledGroupings}
            onSelect={onCollapseAllGroupings}
          >
            <DropdownMenuItemTitle>Collapse Groupings</DropdownMenuItemTitle>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};
