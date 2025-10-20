import { Link } from 'expo-router';
import { View } from 'react-native';
import { Text } from '../../../components/ui/text';
import { RecipeWithIngredients } from '../types';

type RecipeCardProps = {
  recipe: RecipeWithIngredients;
};

export const RecipeCard = ({ recipe }: RecipeCardProps) => {
  return (
    <Link href={`/recipes/${recipe.id}`}>
      <View>
        <View className="w-full flex-row items-center justify-between">
          <Text
            className="overflow-ellipsis text-lg font-bold "
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
