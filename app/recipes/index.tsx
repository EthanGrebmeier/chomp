import { useLocalSearchParams } from 'expo-router';
import { useDeferredValue, useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LayoutAnimationConfig,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { RecipeFilters } from '@/features/recipes/components/recipe-filters';
import { RecipeList } from '@/features/recipes/components/recipe-list';
import { RecipeListSkeleton } from '@/features/recipes/components/recipe-list-skeleton';
import { useRecipes } from '@/features/recipes/hooks';
import {
  filterRecipes,
  RecipeSortOption,
} from '@/features/recipes/utils/filter-recipes';

import { EmptyHeading } from '../../components/text/empty-heading';
import { EmptySubtext } from '../../components/text/empty-subtext';
import { Heading } from '../../components/text/heading';
import { CreateRecipeButton } from '../../features/recipes/components/create-recipe-button';

export default function Recipes() {
  const { listId } = useLocalSearchParams<{ listId?: string }>();
  const { data: recipes, isLoading } = useRecipes();
  const { bottom } = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [mealTag, setMealTag] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<RecipeSortOption>('recent');

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const deferredMealTag = useDeferredValue(mealTag);
  const deferredSortBy = useDeferredValue(sortBy);

  const filteredRecipes = useMemo(
    () =>
      filterRecipes(recipes ?? [], {
        search: deferredSearchQuery,
        mealTag: deferredMealTag,
        sortBy: deferredSortBy,
      }),
    [recipes, deferredMealTag, deferredSearchQuery, deferredSortBy]
  );

  const hasActiveFilters =
    !!searchQuery.trim() || !!mealTag || sortBy !== 'recent';
  const hasFilteredEmptyState =
    filteredRecipes.length === 0 &&
    (recipes?.length ?? 0) > 0 &&
    hasActiveFilters;
  const actionBottom = bottom + 16;

  return (
    <View className="flex-1 bg-background pt-6 ">
      <View className="px-4">
        <Heading>Recipe Book</Heading>
      </View>
      <View className="mt-2">
        <RecipeFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          mealTag={mealTag}
          onMealTagChange={setMealTag}
          sortBy={sortBy}
          onSortByChange={setSortBy}
        />
      </View>
      <View className="px-4">
        <Text className="text-sm text-muted-foreground">
          {filteredRecipes.length} recipe
          {filteredRecipes.length !== 1 ? 's' : ''}
          {searchQuery.trim() && ` matching "${searchQuery.trim()}"`}
          {mealTag && !searchQuery.trim() && ` in ${mealTag}`}
        </Text>
      </View>
      <View className="absolute right-6 z-10" style={{ bottom: actionBottom }}>
        <CreateRecipeButton listId={listId} />
      </View>
      <View className="flex-1">
        {isLoading ? (
          <Animated.View
            key="skeleton"
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="flex-1"
          >
            <RecipeListSkeleton />
          </Animated.View>
        ) : (
          <Animated.View
            key="content"
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            className="flex-1"
          >
            <LayoutAnimationConfig skipEntering={true} skipExiting={true}>
              {hasFilteredEmptyState ? (
                <View className="flex-1 items-center justify-center px-4">
                  <EmptyHeading>No recipes found</EmptyHeading>
                  <EmptySubtext>
                    Try adjusting your search or filters.
                  </EmptySubtext>
                </View>
              ) : (
                <RecipeList recipes={filteredRecipes} listId={listId} />
              )}
            </LayoutAnimationConfig>
          </Animated.View>
        )}
      </View>
    </View>
  );
}
