import { Link } from 'expo-router';
import { View } from 'react-native';
import { Text } from '../../../components/ui/text';
import { RecipeWithIngredients } from '../types';

type RecipeCardProps = {
  recipe: RecipeWithIngredients;
};

export const RecipeCard = ({ recipe }: RecipeCardProps) => {
  return (
    <Link
      href={`/recipe/${recipe.id}`}
      className="rounded-lg border border-border bg-background p-4"
    >
      <View>
        <Text
          className="overflow-ellipsis text-xl font-bold leading-none"
          numberOfLines={2}
        >
          {recipe.name}
        </Text>
        <Text className="text-sm text-muted-foreground">
          {recipe.ingredients.length} ingredients
        </Text>
        {recipe.servings && (
          <Text className="text-sm text-muted-foreground">
            Serves {recipe.servings}
          </Text>
        )}
      </View>
    </Link>
  );
};
