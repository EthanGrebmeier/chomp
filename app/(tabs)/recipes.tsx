import { RecipeList } from '@/features/recipes/components/recipe-list';
import { useCreateRecipe, useRecipes } from '@/features/recipes/hooks';
import { Text as RNText, View } from 'react-native';
import { Heading } from '../../components/text/heading';
import { CreateRecipeButton } from '../../features/recipes/components/create-recipe-button';

export default function Recipes() {
  const { data: recipes, isLoading } = useRecipes();
  const { mutate: createRecipe, isPending } = useCreateRecipe();

  return (
    <View className="py-safe flex-1 bg-background ">
      <View className="px-4">
        <Heading>Recipes</Heading>
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
