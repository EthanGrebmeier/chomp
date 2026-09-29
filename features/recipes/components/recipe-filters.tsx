import { SearchIcon, XIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { TextInput } from '@/components/text-input';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

import { RecipeSortOption } from '../utils/filter-recipes';

import { RecipeFilterDropdownMenu } from './recipe-filter-dropdown-menu';

type RecipeFiltersProps = {
  searchDefaultValue: string;
  searchInputKey: number;
  onSearchChange: (value: string) => void;
  /** When provided, renders a close button beside the search bar. */
  onClose?: () => void;
  mealTag?: string;
  onMealTagChange: (value?: string) => void;
  sortBy?: RecipeSortOption;
  onSortByChange: (value: RecipeSortOption) => void;
};

export const RecipeFilters = ({
  searchDefaultValue,
  searchInputKey,
  onSearchChange,
  onClose,
  mealTag,
  onMealTagChange,
  sortBy = 'recent',
  onSortByChange,
}: RecipeFiltersProps) => {
  return (
    <View className="flex-row items-center gap-2 px-4 pb-2">
      <View className="relative flex-1">
        <TextInput
          key={searchInputKey}
          className="pl-10"
          placeholder="Search recipes..."
          defaultValue={searchDefaultValue}
          onChangeText={onSearchChange}
          autoCorrect={false}
          autoFocus={!!onClose}
          trailingAccessory={
            <RecipeFilterDropdownMenu
              mealTag={mealTag}
              sortBy={sortBy}
              onMealTagChange={onMealTagChange}
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
      {onClose ? (
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
      ) : null}
    </View>
  );
};
