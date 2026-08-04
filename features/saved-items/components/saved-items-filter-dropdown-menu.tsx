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
} from '@/components/native-dropdown';
import { Icon } from '@/components/ui/icon';
import { useCategoryOptions } from '@/features/categories/use-category-options';

export type SavedItemsSortOption = 'name' | 'category';

type SavedItemsFilterDropdownMenuProps = {
  category?: string;
  sortBy: SavedItemsSortOption;
  onCategoryChange: (category?: string) => void;
  onSortByChange: (sortBy: SavedItemsSortOption) => void;
};

export function SavedItemsFilterDropdownMenu({
  category,
  sortBy,
  onCategoryChange,
  onSortByChange,
}: SavedItemsFilterDropdownMenuProps) {
  const { data: categoryOptions } = useCategoryOptions();

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
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger key="filter-by-category-submenu">
            <DropdownMenuItemTitle>
              Filter By Category
            </DropdownMenuItemTitle>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuCheckboxItem
              key="category-all"
              value={!category ? 'on' : 'off'}
              onValueChange={() => onCategoryChange(undefined)}
            >
              <DropdownMenuItemTitle>All Categories</DropdownMenuItemTitle>
            </DropdownMenuCheckboxItem>
            {categoryOptions.map(categoryOption => (
              <DropdownMenuCheckboxItem
                key={`category-${categoryOption.value}`}
                value={category === categoryOption.value ? 'on' : 'off'}
                onValueChange={() => onCategoryChange(categoryOption.value)}
              >
                <DropdownMenuItemTitle>
                  {categoryOption.label}
                </DropdownMenuItemTitle>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
}
