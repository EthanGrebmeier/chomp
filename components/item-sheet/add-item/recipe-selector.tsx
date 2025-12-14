import { SearchIcon } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, View } from 'react-native';

import { useRecipes } from '../../../features/recipes/hooks';
import { RecipeWithIngredients } from '../../../features/recipes/types';
import { TextInput } from '../../text-input';
import { HapticPressable } from '../../ui/haptic-pressable';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';

type RecipeSelectorProps = {
  onSelectRecipe: (recipe: RecipeWithIngredients) => void;
};

export const RecipeSelector = ({ onSelectRecipe }: RecipeSelectorProps) => {
  const { data: recipes, isLoading } = useRecipes();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecipes = (recipes ?? []).filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <View style={{ minHeight: 600 }} className="items-center justify-center">
        <Text className="text-muted-foreground">Loading recipes...</Text>
      </View>
    );
  }

  if (!recipes || recipes.length === 0) {
    return (
      <View style={{ minHeight: 600 }} className="items-center justify-center">
        <Text className="text-lg font-semibold text-foreground">
          No recipes yet
        </Text>
        <Text className="text-muted-foreground">
          Create some recipes first to add them to your list
        </Text>
      </View>
    );
  }

  return (
    <View style={{ minHeight: 600 }}>
      <View className="mb-3 flex-row items-center gap-2">
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
        <View className="items-center justify-center py-8">
          <Text className="text-muted-foreground">No recipes found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <HapticPressable
              onPress={() => onSelectRecipe(item)}
              className="border-b border-border py-3"
              hapticType="light"
            >
              <Text className="text-lg font-semibold text-foreground">
                {item.name}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {item.recipe_ingredients.length} ingredients
              </Text>
            </HapticPressable>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};
