import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { RecipeList } from '@/features/recipes/components/recipe-list';
import { useCreateRecipe, useRecipes } from '@/features/recipes/hooks';
import { router } from 'expo-router';
import { Text as RNText, View } from 'react-native';

export default function Recipes() {
  const { data: recipes, isLoading } = useRecipes();
  const { mutate: createRecipe, isPending } = useCreateRecipe();

  const handleCreateRecipe = () => {
    createRecipe(
      {
        recipe: {
          name: 'My Recipe',
          description: '',
          servings: 4,
        },
        ingredients: [],
      },
      {
        onSuccess: result => {
          router.push(`/recipe/${result.id}?autofocus=true`);
        },
      }
    );
  };

  return (
    <View className="py-safe flex-1 gap-2 bg-background px-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-2xl font-bold">Recipes</Text>
        <Button onPress={handleCreateRecipe} disabled={isPending}>
          <Text>{isPending ? 'Creating...' : 'Create Recipe'}</Text>
        </Button>
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
