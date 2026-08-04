import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import { Heading } from '@/components/text/heading';
import { BackButton } from '@/components/ui/back-button';
import { Text } from '@/components/ui/text';
import { RecipeDetailSkeleton } from '@/features/recipes/components/recipe-detail-skeleton';
import {
  RecipePageForm,
  RecipePageFormData,
} from '@/features/recipes/components/recipe-page-form';
import { useRecipe } from '@/features/recipes/hooks/useRecipe';
import { useUpdateRecipe } from '@/features/recipes/hooks/useUpdateRecipe';
import { db } from '@/lib/instant';
import { navigation } from '@/lib/navigation';

const firstParam = (param?: string | string[]) =>
  Array.isArray(param) ? param[0] : param;

export default function EditRecipePage() {
  const params = useLocalSearchParams<{
    recipeId: string | string[];
    listId?: string | string[];
  }>();
  const recipeId = firstParam(params.recipeId);
  const listId = firstParam(params.listId);
  const { user, isLoading: isAuthLoading } = db.useAuth();
  const { data: recipe, isLoading: isRecipeLoading } = useRecipe(recipeId);
  const { mutate: updateRecipe, isPending } = useUpdateRecipe();
  const isOwner = recipe?.user?.id === user?.id;

  const handleSubmit = (data: RecipePageFormData) => {
    if (!recipeId || !isOwner) return;

    updateRecipe(
      {
        recipeId,
        updates: {
          name: data.name,
          mealTag: data.mealTag,
          description: data.description ?? '',
          sourceUrl: data.sourceUrl,
        },
      },
      {
        onSuccess: () => {
          router.dismissTo(navigation.goToRecipe(recipeId, listId));
        },
        onError: () => {
          toast.error('Failed to update recipe');
        },
      }
    );
  };

  if (isAuthLoading || isRecipeLoading) {
    return (
      <View className="flex-1 bg-background">
        <RecipeDetailSkeleton />
      </View>
    );
  }

  if (!recipe || !isOwner) {
    return (
      <View className="flex-1 bg-background pt-6">
        <View className="mb-6 flex-row items-center gap-3 px-4">
          <BackButton />
          <View className="flex-1">
            <Heading>Edit Recipe</Heading>
          </View>
        </View>
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-center text-muted-foreground">
            {recipe
              ? 'You can only edit recipes you own.'
              : 'Recipe not found.'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background pt-6">
      <View className="mb-6 flex-row items-center gap-3 px-4">
        <BackButton />
        <View className="flex-1">
          <Heading>Edit Recipe</Heading>
        </View>
      </View>

      <View className="flex-1 px-4">
        <RecipePageForm
          mode="edit"
          initialValues={{
            name: recipe.name,
            mealTag: recipe.mealTag,
            description: recipe.description,
            sourceUrl: recipe.sourceUrl,
          }}
          isPending={isPending}
          onSubmit={handleSubmit}
        />
      </View>
    </View>
  );
}
