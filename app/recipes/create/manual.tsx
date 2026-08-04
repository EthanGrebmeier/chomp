import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import { Heading } from '@/components/text/heading';
import { BackButton } from '@/components/ui/back-button';
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
    <View className="flex-1 bg-background pt-6">
      <View className="mb-6 flex-row items-center gap-3 px-4">
        <BackButton />
        <View className="flex-1">
          <Heading>Create Recipe</Heading>
        </View>
      </View>

      <View className="flex-1 px-4">
        <RecipePageForm
          mode="create"
          initialValues={{ name: initialName }}
          isPending={isPending}
          onSubmit={handleSubmit}
        />
      </View>
    </View>
  );
}
