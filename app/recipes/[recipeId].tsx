import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { RecipeDetail } from '@/features/recipes/components/recipe-detail';
import { RecipeDetailSkeleton } from '@/features/recipes/components/recipe-detail-skeleton';
import { useRecipe } from '@/features/recipes/hooks/useRecipe';

export default function RecipeDetailPage() {
  const { recipeId } = useLocalSearchParams<{
    recipeId: string;
  }>();

  const { data: recipe, isLoading } = useRecipe(recipeId);

  return (
    <View className="flex-1 bg-background">
      {isLoading ? (
        <Animated.View
          key="skeleton"
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="flex-1"
        >
          <RecipeDetailSkeleton />
        </Animated.View>
      ) : !recipe ? (
        <Animated.View
          key="not-found"
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          className="flex-1"
        >
          <View className="pt-safe flex-1">
            <View className="flex-1 items-center justify-center">
              <Text className="text-muted-foreground">Recipe not found</Text>
            </View>
          </View>
        </Animated.View>
      ) : (
        <Animated.View
          key="content"
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          className="flex-1"
        >
          <View className="flex-1 gap-2">
            <RecipeDetail recipe={recipe} />
          </View>
        </Animated.View>
      )}
    </View>
  );
}
