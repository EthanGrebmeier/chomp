import { RecipeDetail } from '@/features/recipes/components/recipe-detail';
import { useRecipe } from '@/features/recipes/hooks/useRecipe';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeftIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/ui/icon';

export default function RecipeDetailPage() {
  const { recipeId, autofocus } = useLocalSearchParams<{
    recipeId: string;
    autofocus?: string;
  }>();

  const { data: recipe, isLoading } = useRecipe(recipeId);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <SafeAreaView className="flex-1">
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted-foreground">Loading recipe...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View className="flex-1 bg-background">
        <SafeAreaView className="flex-1">
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted-foreground">Recipe not found</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <Pressable
          onPress={() => router.back()}
          className="mb-4 flex-row items-center gap-2 px-4"
        >
          <Icon as={ArrowLeftIcon} size={16} />
          <Text className="text-sm font-medium text-foreground">Recipes</Text>
        </Pressable>
        <RecipeDetail recipe={recipe} autofocus={autofocus === 'true'} />
      </SafeAreaView>
    </View>
  );
}
