import { TrueSheet } from '@lodev09/react-native-true-sheet';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner-native';

import { ItemEditorSheet } from '../../../components/item-sheet/item-editor-sheet';
import {
  ItemSheetProvider,
  useItemSheet,
} from '../../../components/item-sheet/use-item-sheet';
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
  onDismiss,
}: {
  sheetRef: React.RefObject<TrueSheet | null>;
  onDismiss: () => void;
}) => {
  const { reset } = useItemSheet();

  const handleClose = useCallback(() => {
    reset();
    onDismiss();
  }, [onDismiss, reset]);

  return (
    <ItemEditorSheet
      name="meal-plan-ingredient-override-sheet"
      title="Adjust ingredient"
      sheetRef={sheetRef}
      onDismiss={handleClose}
      actionLabel="Save ingredient"
    />
  );
};

export const MealPlanIngredientOverrideSheet = forwardRef<
  MealPlanIngredientOverrideSheetRef,
  MealPlanIngredientOverrideSheetProps
>(({ onSave }, ref) => {
  const sheetRef = useRef<TrueSheet>(null);
  const setFromItemRef = useRef<((item: BaseGroceryItem) => void) | null>(null);
  const [editingRow, setEditingRow] =
    useState<MealPlanIngredientEditorRow | null>(null);

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
            notes: item.notes?.trim() ?? null,
            category: item.category ?? null,
            storeId: item.storeId,
            isQuantityOverridden:
              editingRow.isQuantityOverridden || quantityChanged,
          },
        });
        sheetRef.current?.dismiss();
      } catch {
        toast.error('Failed to save ingredient override');
        return false;
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
        onDismiss={handleDismiss}
      />
    </ItemSheetProvider>
  );
});

MealPlanIngredientOverrideSheet.displayName = 'MealPlanIngredientOverrideSheet';
