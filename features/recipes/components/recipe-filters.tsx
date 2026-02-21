import { SearchIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { TextInput } from '@/components/text-input';
import { Icon } from '@/components/ui/icon';

import { MealTagFilterSelector } from './meal-tag-filter-selector';
import { RecipeSortBy, RecipeSortBySelector } from './recipe-sort-by-selector';

type RecipeFiltersProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  mealTag?: string;
  onMealTagChange: (value?: string) => void;
  sortBy?: RecipeSortBy;
  onSortByChange: (value: RecipeSortBy) => void;
};

export const RecipeFilters = ({
  searchQuery,
  onSearchChange,
  mealTag,
  onMealTagChange,
  sortBy = 'recent',
  onSortByChange,
}: RecipeFiltersProps) => {
  return (
    <View>
      <View className="px-4">
        <View className="relative">
          <View className="pointer-events-none absolute left-3 top-0 z-10 h-full justify-center">
            <Icon as={SearchIcon} size={18} className="text-muted-foreground" />
          </View>
          <TextInput
            className="pl-10"
            placeholder="Search recipes..."
            value={searchQuery}
            onChangeText={onSearchChange}
            autoCorrect={false}
          />
        </View>
      </View>
      <View className="flex-row gap-2 px-4 pb-2 pt-3">
        <MealTagFilterSelector mealTag={mealTag} onSelect={onMealTagChange} />
        <RecipeSortBySelector value={sortBy} onChange={onSortByChange} />
      </View>
    </View>
  );
};
