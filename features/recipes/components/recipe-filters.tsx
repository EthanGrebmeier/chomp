import { SearchIcon, XIcon } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { TextInput } from '@/components/text-input';
import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

import { MealTagFilterSelector } from './meal-tag-filter-selector';
import { RecipeSortBy, RecipeSortBySelector } from './recipe-sort-by-selector';

type RecipeFiltersProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  mealTag?: string;
  onMealTagChange: (value?: string) => void;
  sortBy?: RecipeSortBy;
  onSortByChange: (value: RecipeSortBy) => void;
  onClearFilters?: () => void;
};

export const RecipeFilters = ({
  searchQuery,
  onSearchChange,
  mealTag,
  onMealTagChange,
  sortBy = 'recent',
  onSortByChange,
  onClearFilters,
}: RecipeFiltersProps) => {
  const trimmedQuery = searchQuery.trim();
  const hasActiveFilters = !!trimmedQuery || !!mealTag || sortBy !== 'recent';

  return (
    <View className="gap-2">
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row gap-2 px-4 pb-2 pt-3"
        className="flex-grow-0"
      >
        <MealTagFilterSelector mealTag={mealTag} onSelect={onMealTagChange} />
        <RecipeSortBySelector value={sortBy} onChange={onSortByChange} />
        {hasActiveFilters && onClearFilters ? (
          <HapticPressable
            onPress={onClearFilters}
            className="flex-row items-center gap-2 rounded-full border border-border bg-muted px-3 py-1"
            hapticType="light"
          >
            <Icon as={XIcon} size={16} className="text-muted-foreground" />
            <Text className="text-base font-medium leading-[18px] text-muted-foreground">
              Clear filters
            </Text>
          </HapticPressable>
        ) : null}
      </ScrollView>
    </View>
  );
};
