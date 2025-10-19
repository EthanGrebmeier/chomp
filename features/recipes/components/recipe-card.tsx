import { Link } from 'expo-router';
import { View } from 'react-native';
import { Text } from '../../../components/ui/text';
import { RecipeWithIngredients } from '../types';

type RecipeCardProps = {
  recipe: RecipeWithIngredients;
};

export const RecipeCard = ({ recipe }: RecipeCardProps) => {
  return (
    <Link href={`/recipe/${recipe.id}`}>
      <View className="flex-1">
        <View className="w-full flex-row items-center justify-between">
          <Text
            className="overflow-ellipsis text-lg font-bold leading-none"
            numberOfLines={2}
          >
            {recipe.name}
          </Text>
          {recipe.servings && (
            <Text className="text-sm text-muted-foreground">
              Serves {recipe.servings}
            </Text>
          )}
        </View>

        <Text className="text-sm text-muted-foreground">
          {recipe.ingredients.length} ingredients
        </Text>
      </View>
    </Link>
  );
};
