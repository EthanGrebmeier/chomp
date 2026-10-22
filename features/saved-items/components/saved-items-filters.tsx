import { SearchIcon, XIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { TextInput } from '@/components/text-input';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

import {
  SavedItemsFilterDropdownMenu,
  type SavedItemsSortOption,
} from './saved-items-filter-dropdown-menu';

type SavedItemsFiltersProps = {
  searchDefaultValue: string;
  searchInputKey: number;
  onSearchChange: (value: string) => void;
  onClose: () => void;
  category?: string;
  onCategoryChange: (category?: string) => void;
  sortBy: SavedItemsSortOption;
  onSortByChange: (sortBy: SavedItemsSortOption) => void;
};

export function SavedItemsFilters({
  searchDefaultValue,
  searchInputKey,
  onSearchChange,
  onClose,
  category,
  onCategoryChange,
  sortBy,
  onSortByChange,
}: SavedItemsFiltersProps) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="relative flex-1">
        <TextInput
          key={searchInputKey}
          className="pl-10"
          placeholder="Search items..."
          defaultValue={searchDefaultValue}
          onChangeText={onSearchChange}
          autoCorrect={false}
          autoFocus
          trailingAccessory={
            <SavedItemsFilterDropdownMenu
              category={category}
              sortBy={sortBy}
              onCategoryChange={onCategoryChange}
              onSortByChange={onSortByChange}
            />
          }
        />
        <View
          className="absolute bottom-0 left-1.5 top-0 w-8 items-center justify-center"
          pointerEvents="none"
        >
          <Icon as={SearchIcon} size={18} className="text-muted-foreground" />
        </View>
      </View>
      <Button
        size="icon"
        variant="secondary"
        onPress={onClose}
        hapticType="light"
        accessibilityLabel="Close search"
      >
        <Icon
          strokeWidth={3}
          className="text-secondary-foreground"
          as={XIcon}
          size={16}
        />
      </Button>
    </View>
  );
}
