import { Link } from 'expo-router';
import { View } from 'react-native';
import { Text } from '../../../components/ui/text';
import { RecipeWithIngredients } from '../types';

type RecipeCardProps = {
  recipe: RecipeWithIngredients;
  className?: string;
};

export const RecipeCard = ({ recipe, className }: RecipeCardProps) => {
  return (
    <Link href={`/recipes/${recipe.id}`}>
      <View className={className}>
        <View className="w-full flex-row items-center justify-between">
          <Text
            className="overflow-ellipsis text-2xl font-bold "
            numberOfLines={2}
          >
            {recipe.name}
          </Text>
        </View>
        <Text className="text-sm text-muted-foreground">
          {recipe.ingredients.length} ingredients
        </Text>
      </View>
    </Link>
  );
};
