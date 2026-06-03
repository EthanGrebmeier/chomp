import { router } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, ListRenderItemInfo, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import {
  CreateRecipeSheet,
  CreateRecipeSheetRef,
} from '../../../features/recipes/components/create-recipe-sheet';
import { RecipeCardContent } from '../../../features/recipes/components/recipe-card';
import { RecipeFilters } from '../../../features/recipes/components/recipe-filters';
import { useCreateRecipe, useRecipes } from '../../../features/recipes/hooks';
import { RecipeWithIngredients } from '../../../features/recipes/types';
import {
  RecipeSortOption,
  filterRecipes,
} from '../../../features/recipes/utils/filter-recipes';
import { navigation } from '../../../lib/navigation';
import { cn } from '../../../lib/utils';
import { HapticPressable } from '../../ui/haptic-pressable';
import { Text } from '../../ui/text';

import { CreateRecipeInlineButton } from './create-recipe-inline-button';

type RecipeSelectorProps = {
  onSelectRecipe: (recipe: RecipeWithIngredients) => void;
  onDismiss?: () => void;
  fillHeight?: boolean;
};

export const RecipeSelector = ({
  onSelectRecipe,
  onDismiss,
  fillHeight = false,
}: RecipeSelectorProps) => {
  const { data: recipes, isLoading } = useRecipes();
  const { mutate: createRecipe } = useCreateRecipe();
  const [searchQuery, setSearchQuery] = useState('');
  const [mealTag, setMealTag] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<RecipeSortOption>('recent');
  const createRecipeSheetRef = useRef<CreateRecipeSheetRef>(null);

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
          onDismiss?.();
          router.push(navigation.goToRecipe(result.id));
        },
      }
    );
  };

  if (!recipes || recipes.length === 0) {
    return (
      <View
        style={{ minHeight: 500 }}
        className="items-center justify-center gap-4"
      >
        <View className="items-center">
          <Text className="text-lg font-semibold text-foreground">
            No recipes yet
          </Text>
          <Text className="text-muted-foreground">
            Create a recipe to add ingredients to your list
          </Text>
        </View>
        <CreateRecipeInlineButton
          label="Create Recipe"
          onPress={() => createRecipeSheetRef.current?.present()}
        />
        <CreateRecipeSheet
          ref={createRecipeSheetRef}
          onSubmit={handleCreateRecipe}
        />
      </View>
    );
  }

  return (
    <View className={cn(fillHeight ? 'flex-1 pb-6' : 'pb-6')}>
      <RecipeFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
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
              onPress={() => handleCreateRecipe({ name: searchQuery.trim() })}
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
    </View>
  );
};
