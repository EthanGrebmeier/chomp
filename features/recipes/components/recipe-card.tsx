import { router } from 'expo-router';
import { View } from 'react-native';

import { navigation } from '@/lib/navigation';

import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Text } from '../../../components/ui/text';
import { RecipeWithIngredients } from '../types';

type RecipeCardProps = {
  recipe: RecipeWithIngredients;
  className?: string;
  listId?: string;
};

export const RecipeCard = ({ recipe, className, listId }: RecipeCardProps) => {
  return (
    <HapticPressable
      className="w-full"
      hapticType="selection"
      onPress={() => router.push(navigation.goToRecipe(recipe.id, listId))}
    >
      <View className={className}>
        <View className="w-full flex-row items-center justify-between">
          <Text
            className="overflow-ellipsis text-xl font-bold "
            numberOfLines={2}
          >
            {recipe.name}
          </Text>
        </View>
        <Text className="text-sm text-muted-foreground">
          {recipe.recipe_ingredients.length} ingredients
        </Text>
      </View>
    </HapticPressable>
  );
};
