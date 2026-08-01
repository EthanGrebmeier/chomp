import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import { BackButton } from '@/components/ui/back-button';
import { Text } from '@/components/ui/text';
import {
  RecipePageForm,
  RecipePageFormData,
} from '@/features/recipes/components/recipe-page-form';
import { useCreateRecipe } from '@/features/recipes/hooks/useCreateRecipe';
import { navigation } from '@/lib/navigation';

const firstParam = (param?: string | string[]) =>
  Array.isArray(param) ? param[0] : param;

export default function ManualCreateRecipePage() {
  const params = useLocalSearchParams<{
    listId?: string | string[];
    name?: string | string[];
  }>();
  const listId = firstParam(params.listId);
  const initialName = firstParam(params.name) ?? '';
  const { mutate: createRecipe, isPending } = useCreateRecipe();

  const handleSubmit = (data: RecipePageFormData) => {
    createRecipe(
      {
        recipe: {
          name: data.name,
          mealTag: data.mealTag,
          description: data.description ?? '',
          sourceUrl: data.sourceUrl,
        },
        ingredients: [],
      },
      {
        onSuccess: result => {
          router.replace(navigation.goToRecipe(result.id, listId));
        },
        onError: () => {
          toast.error('Failed to create recipe');
        },
      }
    );
  };

  return (
    <View className="flex-1 bg-background px-4">
      <View className="mb-4 flex-row items-center">
        <View className="w-12 items-start">
          <BackButton />
        </View>
        <View className="mx-2 flex-1">
          <Text className="text-center text-2xl font-bold">Create Recipe</Text>
        </View>
        <View className="w-12" />
      </View>

      <RecipePageForm
        mode="create"
        initialValues={{ name: initialName }}
        isPending={isPending}
        onSubmit={handleSubmit}
      />
    </View>
  );
}
