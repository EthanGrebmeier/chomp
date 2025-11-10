import { useLocalSearchParams } from 'expo-router';
import { MoreHorizontal } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { RecipeDetail } from '@/features/recipes/components/recipe-detail';
import { useRecipe } from '@/features/recipes/hooks/useRecipe';

import { BackButton } from '../../../components/ui/back-button';
import { Icon } from '../../../components/ui/icon';
import { RecipeDropdownMenu } from '../../../features/recipes/components/dropdown-menu';

export default function RecipeDetailPage() {
  const { recipeId, autofocus } = useLocalSearchParams<{
    recipeId: string;
    autofocus?: string;
  }>();

  const { data: recipe, isLoading } = useRecipe(recipeId);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <View className="pt-safe flex-1">
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
        <View className="pt-safe flex-1">
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted-foreground">Recipe not found</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="pt-safe flex-1 bg-background">
      <View className="flex-1 gap-2">
        <View className="flex-row items-center justify-between px-4">
          <BackButton href="/(tabs)/recipes" />
          <RecipeDropdownMenu
            trigger={<Icon as={MoreHorizontal} size={24} />}
            recipeId={recipeId}
            recipeName={recipe.name}
          />
        </View>
        <RecipeDetail recipe={recipe} autofocus={autofocus === 'true'} />
      </View>
    </View>
  );
}
