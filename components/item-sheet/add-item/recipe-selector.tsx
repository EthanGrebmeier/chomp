import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, ListRenderItemInfo, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useDebounceCallback } from 'usehooks-ts';

import {
  CreateRecipeSheet,
  CreateRecipeSheetRef,
} from '../../../features/recipes/components/create-recipe-sheet';
import { EmptyRecipePrompt } from '../../../features/recipes/components/empty-recipe-prompt';
import { RecipeCardContent } from '../../../features/recipes/components/recipe-card';
import {
  RecipeDetailSheet,
  RecipeDetailSheetRef,
} from '../../../features/recipes/components/recipe-detail-sheet';
import { RecipeFilters } from '../../../features/recipes/components/recipe-filters';
import { useCreateRecipe, useRecipes } from '../../../features/recipes/hooks';
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
  onCreateRecipe?: (initialName?: string) => void;
  listId?: string;
  fillHeight?: boolean;
};

export const RecipeSelector = ({
  onSelectRecipe,
  onCreateRecipe,
  listId,
  fillHeight = false,
}: RecipeSelectorProps) => {
  const { data: recipes, isLoading } = useRecipes();
  const { mutate: createRecipe } = useCreateRecipe();
  const [searchQuery, setSearchQuery] = useState('');
  const [mealTag, setMealTag] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<RecipeSortOption>('recent');
  const createRecipeSheetRef = useRef<CreateRecipeSheetRef>(null);
  const recipeDetailSheetRef = useRef<RecipeDetailSheetRef>(null);
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

  const handleCreateRecipe = (data: { name: string }) => {
    createRecipe(
      {
        recipe: {
          name: data.name,
          description: '',
        },
        ingredients: [],
      },
      {
        onSuccess: result => {
          recipeDetailSheetRef.current?.present(result.id);
        },
      }
    );
  };

  const handleCreateRecipePress = (initialName?: string) => {
    if (onCreateRecipe) {
      onCreateRecipe(initialName);
      return;
    }

    if (initialName) {
      handleCreateRecipe({ name: initialName });
      return;
    }

    createRecipeSheetRef.current?.present();
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
        {!onCreateRecipe ? (
          <>
            <CreateRecipeSheet
              ref={createRecipeSheetRef}
              onSubmit={handleCreateRecipe}
            />
            <RecipeDetailSheet ref={recipeDetailSheetRef} listId={listId} />
          </>
        ) : null}
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
          {searchQuery.trim() && (
            <CreateRecipeInlineButton
              label={`Create "${searchQuery.trim()}"`}
              onPress={() => handleCreateRecipePress(searchQuery.trim())}
            />
          )}
        </Animated.View>
      ) : (
        <FlatList
          className={cn(fillHeight && 'flex-1')}
          data={filteredRecipes}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={renderRecipeItem}
        />
      )}
      {!onCreateRecipe ? (
        <RecipeDetailSheet ref={recipeDetailSheetRef} listId={listId} />
      ) : null}
    </View>
  );
};
