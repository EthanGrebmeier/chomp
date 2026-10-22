import { router, Stack, useLocalSearchParams } from 'expo-router';

import { ImportRecipeFlowProvider } from '@/features/recipes/components/import/import-recipe-flow-context';
import { navigation } from '@/lib/navigation';

const firstParam = (param?: string | string[]) =>
  Array.isArray(param) ? param[0] : param;

/**
 * Hosts the import flow state above both the URL/preview screen and the
 * pushed "Edit Ingredients" screen so they share a single state machine.
 */
export default function ImportRecipeLayout() {
  const params = useLocalSearchParams<{ listId?: string | string[] }>();
  const listId = firstParam(params.listId);

  return (
    <ImportRecipeFlowProvider
      onImportSuccess={recipeId => {
        router.replace(navigation.goToRecipe(recipeId, listId));
      }}
    >
      <Stack screenOptions={{ headerShown: false }} />
    </ImportRecipeFlowProvider>
  );
}
