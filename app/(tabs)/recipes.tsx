import { Text } from '@/components/ui/text';
import { RecipeList } from '@/features/recipes/components/recipe-list';
import { useCreateRecipe, useRecipes } from '@/features/recipes/hooks';
import { Text as RNText, View } from 'react-native';
import { CreateRecipeButton } from '../../features/recipes/components/create-recipe-button';

export default function Recipes() {
  const { data: recipes, isLoading } = useRecipes();
  const { mutate: createRecipe, isPending } = useCreateRecipe();

  return (
    <View className="py-safe flex-1 bg-background ">
      <View className="flex-row items-center justify-between px-4">
        <Text className="text-2xl font-bold">Recipes</Text>
      </View>
      <View className="absolute bottom-4 right-4">
        <CreateRecipeButton />
      </View>
      <View className="flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <RNText className="text-gray-500">Loading recipes...</RNText>
          </View>
        ) : (
          <RecipeList recipes={recipes || []} />
        )}
      </View>
    </View>
  );
}
