import { ListFilter } from 'lucide-react-native';
import { View } from 'react-native';

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
  const hasActiveFilters = !!category || sortBy !== 'name';

  return (
    <View className="relative">
      <DropdownMenuRoot>
        <DropdownMenuTrigger>
          <View
            className="size-8 items-center justify-center"
            accessibilityLabel="Sort and filter saved items"
          >
            <Icon
              as={ListFilter}
              size={18}
              className={
                hasActiveFilters ? 'text-foreground' : 'text-muted-foreground'
              }
            />
          </View>
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
              <DropdownMenuItemTitle>Filter By Category</DropdownMenuItemTitle>
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
      {hasActiveFilters ? (
        <View
          pointerEvents="none"
          className="absolute right-0.5 top-0.5 size-2.5 rounded-full border-2 border-input bg-primary"
        />
      ) : null}
    </View>
  );
}
