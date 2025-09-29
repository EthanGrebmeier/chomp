import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { RecipeWithIngredients } from '../types';

type RecipeCardProps = {
  recipe: RecipeWithIngredients;
  cardWidth: number;
};

export const RecipeCard = ({ recipe, cardWidth }: RecipeCardProps) => {
  return (
    <Link
      href={`/recipe/${recipe.id}`}
      className="rounded-lg border border-gray-200 bg-background p-4"
      style={{ width: cardWidth }}
    >
      <View>
        <Text
          className="overflow-ellipsis text-xl font-bold leading-none"
          numberOfLines={2}
        >
          {recipe.name}
        </Text>
        <Text className="text-sm text-gray-500">
          {recipe.ingredients.length} ingredients
        </Text>
        {recipe.servings && (
          <Text className="text-sm text-gray-500">
            Serves {recipe.servings}
          </Text>
        )}
      </View>
    </Link>
  );
};
