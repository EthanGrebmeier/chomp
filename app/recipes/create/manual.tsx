import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { toast } from 'sonner-native';

import { SheetHeader } from '@/components/sheet-header';
import { SurfaceContent } from '@/components/surface-content';
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
    <View className="flex-1 bg-background">
      <SheetHeader title="Create Recipe" backAction={<BackButton />} />

      <SurfaceContent spacing="wide" className="flex-1">
        <RecipePageForm
          mode="create"
          initialValues={{ name: initialName }}
          isPending={isPending}
          onSubmit={handleSubmit}
        />
      </SurfaceContent>
    </View>
  );
}
