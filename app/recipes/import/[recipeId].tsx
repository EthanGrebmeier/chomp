import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useCreateRecipe } from '@/features/recipes/hooks/useCreateRecipe';
import { useRecipe } from '@/features/recipes/hooks/useRecipe';
import { useRecipes } from '@/features/recipes/hooks/useRecipes';
import { db } from '@/lib/instant';
import { navigation } from '@/lib/navigation';

export default function ImportSharedRecipe() {
  const { recipeId } = useLocalSearchParams<{ recipeId?: string | string[] }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = db.useAuth();
  const connectionStatus = db.useConnectionStatus();
  const { data: ownedRecipes, isLoading: recipesLoading } = useRecipes();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasStartedImport, setHasStartedImport] = useState(false);

  const sourceRecipeId = useMemo(() => {
    if (!recipeId) return undefined;
    return Array.isArray(recipeId) ? recipeId[0] : recipeId;
  }, [recipeId]);

  const { data: sourceRecipe, isLoading: sourceLoading } =
    useRecipe(sourceRecipeId);
  const { mutate: createRecipe, isPending: isCreating } = useCreateRecipe();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!sourceRecipeId) {
        setErrorMessage('Invalid recipe link.');
        return;
      }

      if (authLoading || recipesLoading || sourceLoading) return;

      if (connectionStatus === 'closed' || connectionStatus === 'errored') {
        setErrorMessage(
          'You are offline. Please check your internet connection and try again.'
        );
        return;
      }

      if (!user) {
        setErrorMessage('Please sign in to import recipes.');
        return;
      }

      if (connectionStatus !== 'authenticated') return;

      const existingRecipe = ownedRecipes?.find(
        recipe => recipe.sourceRecipeId === sourceRecipeId
      );

      if (existingRecipe) {
        router.replace(navigation.goToRecipe(existingRecipe.id));
        return;
      }

      if (sourceRecipe?.user?.id === user.id) {
        router.replace(navigation.goToRecipe(sourceRecipeId));
        return;
      }

      if (!sourceRecipe) {
        setErrorMessage('Recipe not found or no longer available.');
        return;
      }

      if (hasStartedImport || isCreating) return;

      setHasStartedImport(true);
      setErrorMessage(null);

      createRecipe(
        {
          recipe: {
            name: sourceRecipe.name,
            description: sourceRecipe.description,
            imageSrc: sourceRecipe.imageSrc,
            visibility: 'private',
            mealTag: sourceRecipe.mealTag ?? undefined,
            sourceUrl: sourceRecipe.sourceUrl ?? undefined,
            servings: sourceRecipe.servings ?? undefined,
            sourceRecipeId: sourceRecipe.id,
          },
          ingredients: sourceRecipe.recipe_ingredients.map(ingredient => ({
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            notes: ingredient.notes ?? undefined,
            category: ingredient.category ?? undefined,
          })),
        },
        {
          onSuccess: result => {
            router.replace(navigation.goToRecipe(result.id));
          },
          onError: () => {
            setHasStartedImport(false);
            setErrorMessage('Unable to import recipe. Please try again.');
          },
        }
      );
    });

    return () => cancelAnimationFrame(frame);
  }, [
    sourceRecipeId,
    authLoading,
    recipesLoading,
    sourceLoading,
    connectionStatus,
    user,
    ownedRecipes,
    sourceRecipe,
    hasStartedImport,
    isCreating,
    createRecipe,
    router,
  ]);

  if (authLoading || recipesLoading || sourceLoading || isCreating) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-center text-lg text-muted-foreground">
          Importing recipe...
        </Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="mb-2 text-center text-2xl font-bold text-foreground">
          Unable to Import Recipe
        </Text>
        <Text className="mb-8 text-center text-base text-muted-foreground">
          {errorMessage}
        </Text>
        <Button
          onPress={() => router.replace(navigation.goToRecipes())}
          className="w-full max-w-sm"
        >
          <Text>Go to Recipes</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" />
    </View>
  );
}
