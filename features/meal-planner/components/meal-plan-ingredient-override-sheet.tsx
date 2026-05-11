import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { ItemForm } from '../../../components/item-sheet/item-form';
import { MetaBar } from '../../../components/item-sheet/meta-bar';
import {
  ItemSheetProvider,
  useItemSheet,
} from '../../../components/item-sheet/use-item-sheet';
import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';
import { BaseGroceryItem } from '../../grocery-list/types';
import { MealPlanIngredientEditorRow } from '../meal-plan-recipe-ingredient-editor';

type OverrideUpdates = {
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  storeId?: string;
  isQuantityOverridden: boolean;
};

type SaveArgs = {
  sourceRecipeIngredientId: string;
  updates: OverrideUpdates;
};

export type MealPlanIngredientOverrideSheetRef = {
  present: (row: MealPlanIngredientEditorRow) => void;
  dismiss: () => void;
};

type MealPlanIngredientOverrideSheetProps = {
  onSave: (args: SaveArgs) => Promise<void> | void;
};

const EditMealIngredientSheetContents = ({
  sheetRef,
  editingRow,
  onDismiss,
}: {
  sheetRef: React.RefObject<TrueSheet | null>;
  editingRow: MealPlanIngredientEditorRow | null;
  onDismiss: () => void;
}) => {
  const { reset, itemInputRef, onSubmit, isValid } = useItemSheet();

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    reset();
    onDismiss();
  }, [onDismiss, reset]);

  const handleOpen = useCallback(() => {
    setTimeout(() => {
      itemInputRef.current?.focus();
    }, 100);
  }, [itemInputRef]);

  return (
    <BottomSheet
      viewClassName="pb-safe"
      name="meal-plan-ingredient-override-sheet"
      ref={sheetRef}
      onStartClose={handleClose}
      onOpen={handleOpen}
      footer={
        <BottomSheet.SheetView className="px-4 pb-safe pt-3">
          <Button onPress={onSubmit} disabled={!isValid}>
            <Text>Save ingredient</Text>
          </Button>
        </BottomSheet.SheetView>
      }
    >
      <BottomSheet.SheetView>
        <BottomSheet.Header
          title={editingRow?.name ? `Edit ${editingRow.name}` : 'Edit Ingredient'}
          className="mb-4"
        />
        <ItemForm />
        <MetaBar />
      </BottomSheet.SheetView>
    </BottomSheet>
  );
};

export const MealPlanIngredientOverrideSheet = forwardRef<
  MealPlanIngredientOverrideSheetRef,
  MealPlanIngredientOverrideSheetProps
>(({ onSave }, ref) => {
  const sheetRef = useRef<TrueSheet>(null);
  const setFromItemRef = useRef<((item: BaseGroceryItem) => void) | null>(null);
  const [editingRow, setEditingRow] = useState<MealPlanIngredientEditorRow | null>(
    null
  );

  useImperativeHandle(ref, () => ({
    present: (row: MealPlanIngredientEditorRow) => {
      setEditingRow(row);
      setFromItemRef.current?.({
        name: row.name,
        quantity: row.quantity,
        unit: row.unit,
        notes: row.notes ?? undefined,
        category: row.category ?? undefined,
        storeId: row.storeId,
      });
      sheetRef.current?.present();
    },
    dismiss: () => {
      sheetRef.current?.dismiss();
    },
  }));

  const handleSubmit = useCallback(
    async ({ item }: { item: BaseGroceryItem }) => {
      if (!editingRow) return;

      const quantityChanged = item.quantity !== editingRow.quantity;
      try {
        await onSave({
          sourceRecipeIngredientId: editingRow.sourceRecipeIngredientId,
          updates: {
            name: item.name.trim(),
            quantity: item.quantity,
            unit: item.unit,
            notes: item.notes?.trim() || null,
            category: item.category ?? null,
            storeId: item.storeId,
            isQuantityOverridden:
              editingRow.isQuantityOverridden || quantityChanged,
          },
        });
        sheetRef.current?.dismiss();
      } catch {
        toast.error('Failed to save ingredient override');
      }
    },
    [editingRow, onSave]
  );

  const handleDismiss = useCallback(() => {
    setEditingRow(null);
  }, []);

  return (
    <ItemSheetProvider
      mode="update"
      onSubmit={handleSubmit}
      setFromItemRef={setFromItemRef}
      disableAutocomplete
    >
      <EditMealIngredientSheetContents
        sheetRef={sheetRef}
        editingRow={editingRow}
        onDismiss={handleDismiss}
      />
    </ItemSheetProvider>
  );
});

MealPlanIngredientOverrideSheet.displayName = 'MealPlanIngredientOverrideSheet';
