import { Dimensions, Text, View } from 'react-native';
import { RecipeWithIngredients } from '../types';
import { RecipeCard } from './recipe-card';

type RecipeListProps = {
  recipes: RecipeWithIngredients[];
};

export const RecipeList = ({ recipes }: RecipeListProps) => {
  const screenWidth = Dimensions.get('window').width;
  const gap = 16; // 4 * 4px = 16px gap (gap-4 in Tailwind)
  const padding = 32; // Assuming 16px padding on each side (p-4)
  const availableWidth = screenWidth - padding;
  const cardWidth = (availableWidth - gap) / 2;

  if (recipes.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-center text-gray-500">
          No recipes yet. Create your first recipe to get started!
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap" style={{ gap }}>
      {recipes.map(recipe => (
        <RecipeCard key={recipe.id} recipe={recipe} cardWidth={cardWidth} />
      ))}
    </View>
  );
};
