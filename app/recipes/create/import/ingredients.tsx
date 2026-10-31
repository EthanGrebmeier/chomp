import { Redirect, router } from 'expo-router';
import { useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SheetHeader } from '@/components/sheet-header';
import { BackButton } from '@/components/ui/back-button';
import { BottomActionButton } from '@/components/ui/bottom-action-button';
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
      <SheetHeader title="Edit Ingredients" backAction={<BackButton />} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-3 px-8 pb-6"
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
        className="border-t border-border bg-background px-8 pt-4"
        style={{ paddingBottom: bottomInset + 24 }}
      >
        <BottomActionButton onPress={() => router.back()}>
          <Text>Done</Text>
        </BottomActionButton>
      </View>

      <EditParsedIngredientSheet
        ref={editSheetRef}
        onSave={flow.handleSaveIngredient}
      />
    </View>
  );
}
