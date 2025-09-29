import { Button } from '@/components/ui/button';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRef } from 'react';
import { Dimensions, FlatList, View } from 'react-native';
import { BottomSheet } from '../../../components/bottom-sheet';
import { Text } from '../../../components/ui/text';
import { useAddRecipeToList } from '../../recipes/hooks/useAddRecipeToList';
import { useRecipes } from '../../recipes/hooks/useRecipes';
import { RecipeWithIngredients } from '../../recipes/types';

type AddRecipeSheetProps = {
  groceryListId: string;
};

export const AddRecipeSheet = ({ groceryListId }: AddRecipeSheetProps) => {
  const ref = useRef<BottomSheetModal>(null);
  const { data: recipes, isLoading } = useRecipes();
  const { mutate: addRecipeToList, isPending } = useAddRecipeToList();

  const screenWidth = Dimensions.get('window').width;
  const gap = 16;
  const padding = 32;
  const availableWidth = screenWidth - padding;
  const cardWidth = (availableWidth - gap) / 2;

  const handleRecipeSelect = (recipe: RecipeWithIngredients) => {
    addRecipeToList(
      {
        recipeId: recipe.id,
        groceryListId,
      },
      {
        onSuccess: () => {
          ref.current?.dismiss();
        },
      }
    );
  };

  const renderRecipe = ({ item }: { item: RecipeWithIngredients }) => (
    <Button
      onPress={() => handleRecipeSelect(item)}
      disabled={isPending}
      className="rounded-lg border border-gray-200 bg-background p-4"
      style={{ width: cardWidth, minHeight: 120 }}
    >
      <View className="flex-1">
        <Text
          className="overflow-ellipsis text-xl font-bold leading-none text-foreground"
          numberOfLines={2}
        >
          {item.name}
        </Text>
        <Text className="text-sm text-gray-500">
          {item.ingredients.length} ingredients
        </Text>
        {item.servings && (
          <Text className="text-sm text-gray-500">Serves {item.servings}</Text>
        )}
      </View>
    </Button>
  );

  return (
    <>
      <Button onPress={() => ref.current?.present()}>
        <Text>Add Recipe</Text>
      </Button>
      <BottomSheet onClose={() => {}} ref={ref}>
        <View className="gap-4 pb-4">
          <Text className="text-2xl font-bold">Add Recipe to List</Text>
          {isLoading ? (
            <View className="flex-1 items-center justify-center p-8">
              <Text className="text-gray-500">Loading recipes...</Text>
            </View>
          ) : recipes && recipes.length > 0 ? (
            <FlatList
              data={recipes}
              renderItem={renderRecipe}
              keyExtractor={item => item.id}
              numColumns={2}
              contentContainerStyle={{ gap }}
              columnWrapperStyle={{ gap }}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View className="flex-1 items-center justify-center p-8">
              <Text className="text-center text-gray-500">
                No recipes yet. Create your first recipe to get started!
              </Text>
            </View>
          )}
        </View>
      </BottomSheet>
    </>
  );
};
