import { useCallback, useMemo, useState } from 'react';
import { FlatList, ListRenderItemInfo, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDebounceCallback } from 'usehooks-ts';

import { EmptyRecipePrompt } from '../../../features/recipes/components/empty-recipe-prompt';
import { RecipeCardContent } from '../../../features/recipes/components/recipe-card';
import { RecipeFilters } from '../../../features/recipes/components/recipe-filters';
import { useRecipes } from '../../../features/recipes/hooks/useRecipes';
import { RecipeWithIngredients } from '../../../features/recipes/types';
import {
  RecipeSortOption,
  filterRecipes,
} from '../../../features/recipes/utils/filter-recipes';
import { cn } from '../../../lib/utils';
import { HapticPressable } from '../../ui/haptic-pressable';
import { Text } from '../../ui/text';
import { useUncontrolledTextInput } from '../../use-uncontrolled-text-input';

import { CreateRecipeInlineButton } from './create-recipe-inline-button';

const SEARCH_QUERY_DEBOUNCE_MS = 300;

type RecipeSelectorProps = {
  onSelectRecipe: (recipe: RecipeWithIngredients) => void;
  onCreateRecipe: (initialName?: string) => void;
  fillHeight?: boolean;
  listHeight?: number;
};

export const RecipeSelector = ({
  onSelectRecipe,
  onCreateRecipe,
  fillHeight = false,
  listHeight,
}: RecipeSelectorProps) => {
  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  const { data: recipes, isLoading } = useRecipes();
  const [searchQuery, setSearchQuery] = useState('');
  const [mealTag, setMealTag] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<RecipeSortOption>('recent');
  const {
    inputKey: searchInputKey,
    defaultValue: searchDefaultValue,
    handleChangeText: handleSearchInputChange,
  } = useUncontrolledTextInput();
  const debouncedSetSearchQuery = useDebounceCallback(
    setSearchQuery,
    SEARCH_QUERY_DEBOUNCE_MS
  );

  const handleSearchChange = useCallback(
    (text: string) => {
      handleSearchInputChange(text);
      debouncedSetSearchQuery(text);
    },
    [debouncedSetSearchQuery, handleSearchInputChange]
  );

  const filteredRecipes = useMemo(() => {
    return filterRecipes(recipes ?? [], {
      search: searchQuery,
      mealTag,
      sortBy,
    });
  }, [mealTag, recipes, searchQuery, sortBy]);

  const renderRecipeItem = useCallback(
    ({ item, index }: ListRenderItemInfo<RecipeWithIngredients>) => (
      <HapticPressable
        onPress={() => onSelectRecipe(item)}
        className={cn(
          'w-full px-4 py-1',
          index < filteredRecipes.length - 1 &&
            'border-b border-dashed border-border'
        )}
        hapticType="light"
      >
        <RecipeCardContent
          name={item.name}
          ingredientCount={item.recipe_ingredients.length}
          className="w-full"
        />
      </HapticPressable>
    ),
    [filteredRecipes.length, onSelectRecipe]
  );

  if (isLoading) {
    return (
      <View style={{ minHeight: 500 }} className="items-center justify-center">
        <Text className="text-muted-foreground">Loading recipes…</Text>
      </View>
    );
  }

  const handleCreateRecipePress = (initialName?: string) => {
    onCreateRecipe(initialName);
  };

  if (!recipes || recipes.length === 0) {
    return (
      <View
        style={{ minHeight: 500 }}
        className="flex-1 items-center justify-center gap-4"
      >
        <EmptyRecipePrompt />
        <CreateRecipeInlineButton
          label="Create Recipe"
          onPress={() => handleCreateRecipePress()}
        />
      </View>
    );
  }

  return (
    <View className={cn(fillHeight ? 'flex-1 pb-6' : 'pb-6')}>
      <RecipeFilters
        searchInputKey={searchInputKey}
        searchDefaultValue={searchDefaultValue}
        onSearchChange={handleSearchChange}
        mealTag={mealTag}
        onMealTagChange={setMealTag}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />
      <View className="px-4 pb-2">
        <Text className="text-sm text-muted-foreground">
          {filteredRecipes.length} recipe
          {filteredRecipes.length === 1 ? '' : 's'}
        </Text>
      </View>
      {filteredRecipes.length === 0 ? (
        <Animated.View
          key="no-results"
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          className="items-center justify-center gap-4 py-8"
        >
          <Text className="text-muted-foreground">No recipes found</Text>
          {searchQuery.trim() ? (
            <CreateRecipeInlineButton
              label={`Create "${searchQuery.trim()}"`}
              onPress={() => handleCreateRecipePress(searchQuery.trim())}
            />
          ) : null}
        </Animated.View>
      ) : (
        <FlatList
          className={cn(fillHeight && 'flex-1')}
          contentInset={{ bottom: safeAreaBottom + 24 }}
          data={filteredRecipes}
          keyExtractor={item => item.id}
          renderItem={renderRecipeItem}
          scrollIndicatorInsets={{ bottom: safeAreaBottom + 24 }}
          showsVerticalScrollIndicator={false}
          style={listHeight ? { height: listHeight } : undefined}
        />
      )}
    </View>
  );
};
