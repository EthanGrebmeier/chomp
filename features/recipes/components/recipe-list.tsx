import { FlatList, Text, View } from 'react-native';
import { RecipeWithIngredients } from '../types';
import { RecipeCard } from './recipe-card';

type RecipeListProps = {
  recipes: RecipeWithIngredients[];
};

export const RecipeList = ({ recipes }: RecipeListProps) => {
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
    <FlatList
      className="flex-col"
      data={recipes}
      renderItem={({ item }) => <RecipeCard recipe={item} />}
      keyExtractor={item => item.id}
      ItemSeparatorComponent={() => <View className="h-4" />}
      contentContainerClassName="flex-1"
    />
  );
};
