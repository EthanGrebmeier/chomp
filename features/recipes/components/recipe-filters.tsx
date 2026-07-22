import { SearchIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { TextInput } from '@/components/text-input';
import { Icon } from '@/components/ui/icon';

import { RecipeSortOption } from '../utils/filter-recipes';

import { RecipeFilterDropdownMenu } from './recipe-filter-dropdown-menu';

type RecipeFiltersProps = {
  searchDefaultValue: string;
  searchInputKey: number;
  onSearchChange: (value: string) => void;
  mealTag?: string;
  onMealTagChange: (value?: string) => void;
  sortBy?: RecipeSortOption;
  onSortByChange: (value: RecipeSortOption) => void;
};

export const RecipeFilters = ({
  searchDefaultValue,
  searchInputKey,
  onSearchChange,
  mealTag,
  onMealTagChange,
  sortBy = 'recent',
  onSortByChange,
}: RecipeFiltersProps) => {
  return (
    <View>
      <View className="px-4 pb-2">
        <View className="flex-row items-center gap-4">
          <View className="relative flex-1">
            <View className="pointer-events-none absolute left-3 top-0 z-10 h-full justify-center">
              <Icon
                as={SearchIcon}
                size={18}
                className="text-muted-foreground"
              />
            </View>
            <TextInput
              key={searchInputKey}
              className="pl-10"
              placeholder="Search recipes..."
              defaultValue={searchDefaultValue}
              onChangeText={onSearchChange}
              autoCorrect={false}
            />
          </View>
          <RecipeFilterDropdownMenu
            mealTag={mealTag}
            sortBy={sortBy}
            onMealTagChange={onMealTagChange}
            onSortByChange={onSortByChange}
          />
        </View>
      </View>
    </View>
  );
};
