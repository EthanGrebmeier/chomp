import { router } from 'expo-router';
import { SearchIcon } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { toast } from 'sonner-native';

import {
  CreateRecipeSheet,
  CreateRecipeSheetRef,
} from '../../../features/recipes/components/create-recipe-sheet';
import { useCreateRecipe, useRecipes } from '../../../features/recipes/hooks';
import { RecipeWithIngredients } from '../../../features/recipes/types';
import { navigation } from '../../../lib/navigation';
import { cn } from '../../../lib/utils';
import { TextInput } from '../../text-input';
import { HapticPressable } from '../../ui/haptic-pressable';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';

import { CreateRecipeInlineButton } from './create-recipe-inline-button';

type RecipeSelectorProps = {
  onSelectRecipe: (recipe: RecipeWithIngredients) => void;
  onDismiss?: () => void;
};

export const RecipeSelector = ({
  onSelectRecipe,
  onDismiss,
}: RecipeSelectorProps) => {
  const { data: recipes, isLoading } = useRecipes();
  const { mutate: createRecipe } = useCreateRecipe();
  const [searchQuery, setSearchQuery] = useState('');
  const createRecipeSheetRef = useRef<CreateRecipeSheetRef>(null);

  const filteredRecipes = useMemo(() => {
    return (recipes ?? []).filter(recipe =>
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [recipes, searchQuery]);

  if (isLoading) {
    return (
      <View style={{ minHeight: 500 }} className="items-center justify-center">
        <Text className="text-muted-foreground">Loading recipes...</Text>
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
          toast.success('Recipe created');
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
    <View>
      <View className="flex-row items-center gap-2 px-4 ">
        <Icon as={SearchIcon} size={20} className="text-muted-foreground" />
        <TextInput
          className="flex-1"
          placeholder="Search recipes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
        />
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
        <ScrollView
          className="px-4"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {filteredRecipes.map((item, index) => (
            <HapticPressable
              key={item.id}
              onPress={() => onSelectRecipe(item)}
              className={cn(
                'w-full py-3',
                index < filteredRecipes.length - 1 && 'border-b border-border'
              )}
              hapticType="light"
            >
              <Text className="text-lg font-semibold text-foreground">
                {item.name}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {item.recipe_ingredients.length} ingredients
              </Text>
            </HapticPressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
};
