import { FlatList, Text, View } from 'react-native';
import { ListItem } from '../../../components/ui/list-item';
import { useDeleteRecipe } from '../hooks';
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
  const { mutate: deleteRecipe } = useDeleteRecipe();
  const handleDelete = (recipeId: string) => {
    deleteRecipe(recipeId);
  };

  return (
    <FlatList
      className="flex-col"
      data={recipes}
      renderItem={({ item }) => (
        <ListItem onDelete={() => handleDelete(item.id)}>
          <RecipeCard recipe={item} />
        </ListItem>
      )}
      keyExtractor={item => item.id}
      contentContainerClassName="flex-1"
    />
  );
};
