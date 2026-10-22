import { Redirect, router } from 'expo-router';
import { useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import {
  EditParsedIngredientSheet,
  EditParsedIngredientSheetRef,
} from '@/features/recipes/components/import/edit-parsed-ingredient-sheet';
import { useImportRecipeFlowContext } from '@/features/recipes/components/import/import-recipe-flow-context';
import {
  IngredientListHeader,
  IngredientListPreview,
} from '@/features/recipes/components/import/ingredient-list-preview';
import { ROUTES } from '@/lib/navigation';

/**
 * Full ingredient review for an in-progress import: check/uncheck rows and
 * tap a row to edit it. State lives in the flow provider one level up, so
 * changes are visible immediately on the preview screen when popping back.
 */
export default function ImportRecipeIngredientsPage() {
  const flow = useImportRecipeFlowContext();
  const editSheetRef = useRef<EditParsedIngredientSheetRef>(null);
  const bottomInset = useSafeAreaInsets().bottom;

  // Only reachable from the preview step; anything else (deep link, stale
  // stack after a reset) has nothing to edit.
  if (flow.state.status !== 'preview') {
    return <Redirect href={ROUTES.RECIPES.CREATE_IMPORT} />;
  }

  const { state } = flow;
  const selectedCount = state.selectedIndices.size;
  const totalCount = state.ingredients.length;

  return (
    <View className="flex-1 bg-background">
      <View className="mb-4 flex-row items-center px-4">
        <View className="w-12 items-start">
          <BackButton />
        </View>
        <View className="mx-2 flex-1">
          <Text className="text-center text-2xl font-bold">
            Edit Ingredients
          </Text>
        </View>
        <View className="w-12" />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-3 px-4 pb-6"
      >
        <IngredientListHeader
          selectedCount={selectedCount}
          totalCount={totalCount}
          allSelected={selectedCount === totalCount}
          onToggleAll={flow.toggleAllIngredients}
          isEditable
        />
        <Text className="text-sm text-muted-foreground">
          Tap an ingredient to edit it, or uncheck ones you don&apos;t want.
        </Text>
        <IngredientListPreview
          ingredients={state.ingredients}
          selectedIndices={state.selectedIndices}
          onToggleSelection={flow.toggleIngredientSelection}
          onToggleAll={flow.toggleAllIngredients}
          onEdit={(index, ingredient) =>
            editSheetRef.current?.present(index, ingredient)
          }
          showHeader={false}
        />
      </ScrollView>

      <View
        className="border-t border-border bg-background px-4 pt-3"
        style={{ paddingBottom: Math.max(bottomInset, 12) }}
      >
        <Button size="xl" onPress={() => router.back()}>
          <Text>Done</Text>
        </Button>
      </View>

      <EditParsedIngredientSheet
        ref={editSheetRef}
        onSave={flow.handleSaveIngredient}
      />
    </View>
  );
}
