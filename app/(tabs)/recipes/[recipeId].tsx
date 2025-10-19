import { RecipeDetail } from '@/features/recipes/components/recipe-detail';
import { useRecipe } from '@/features/recipes/hooks/useRecipe';
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { BackButton } from '../../../components/ui/back-button';

export default function RecipeDetailPage() {
  const { recipeId, autofocus } = useLocalSearchParams<{
    recipeId: string;
    autofocus?: string;
  }>();

  const { data: recipe, isLoading } = useRecipe(recipeId);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <View className="py-safe flex-1">
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted-foreground">Loading recipe...</Text>
          </View>
        </View>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View className="flex-1 bg-background">
        <View className="py-safe flex-1">
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted-foreground">Recipe not found</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="py-safe flex-1">
        <BackButton />
        <RecipeDetail recipe={recipe} autofocus={autofocus === 'true'} />
      </View>
    </View>
  );
}
