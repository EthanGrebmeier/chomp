import { TrueSheet } from '@lodev09/react-native-true-sheet';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Keyboard } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { ItemForm } from '@/components/item-sheet/item-form';
import { MetaBar } from '@/components/item-sheet/meta-bar';
import {
  ItemSheetProvider,
  useItemSheet,
} from '@/components/item-sheet/use-item-sheet';
import { BaseGroceryItem } from '@/features/grocery-list/types';

import { IngredientCategory, ParsedIngredient } from '../../api/types';
import {
  baseGroceryItemToParsedIngredient,
  parsedIngredientToBaseGroceryItem,
} from '../../utils/parsed-ingredient-converters';

export type EditParsedIngredientSheetRef = {
  present: (index: number, ingredient: ParsedIngredient) => void;
  dismiss: () => void;
};

export type EditParsedIngredientSheetProps = {
  onSave: (index: number, ingredient: ParsedIngredient) => void;
  onCancel?: () => void;
};

type EditingState = {
  index: number;
  originalCategory: IngredientCategory;
} | null;

/**
 * Internal component that renders the sheet contents.
 * Must be inside ItemSheetProvider to access the form context.
 */
const EditSheetContents = ({
  sheetRef,
  editingState,
  onSave,
  onDismiss,
}: {
  sheetRef: React.RefObject<TrueSheet | null>;
  editingState: EditingState;
  onSave: (index: number, ingredient: ParsedIngredient) => void;
  onDismiss: () => void;
}) => {
  const { reset, itemInputRef } = useItemSheet();

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    reset();
    onDismiss();
  }, [reset, onDismiss]);

  const handleOpen = useCallback(() => {
    itemInputRef.current?.focus();
  }, [itemInputRef]);

  return (
    <BottomSheet
      viewClassName="pb-4"
      name="edit-parsed-ingredient-sheet"
      ref={sheetRef}
      onStartClose={handleClose}
      onOpen={handleOpen}
    >
      <BottomSheet.SheetView>
        <BottomSheet.Header title="Edit Ingredient" className="mb-4" />
        <ItemForm />
        <MetaBar />
      </BottomSheet.SheetView>
    </BottomSheet>
  );
};

export const EditParsedIngredientSheet = forwardRef<
  EditParsedIngredientSheetRef,
  EditParsedIngredientSheetProps
>(({ onSave, onCancel }, ref) => {
  const sheetRef = useRef<TrueSheet>(null);
  const setFromItemRef = useRef<((item: BaseGroceryItem) => void) | null>(null);
  const [editingState, setEditingState] = useState<EditingState>(null);

  useImperativeHandle(ref, () => ({
    present: (index: number, ingredient: ParsedIngredient) => {
      // Store the editing context
      setEditingState({
        index,
        originalCategory: ingredient.category,
      });

      // Convert and populate the form
      const baseItem = parsedIngredientToBaseGroceryItem(ingredient);
      setFromItemRef.current?.(baseItem);

      // Present the sheet
      sheetRef.current?.present();
    },
    dismiss: () => {
      sheetRef.current?.dismiss();
    },
  }));

  const handleSubmit = useCallback(
    ({ item }: { item: BaseGroceryItem }) => {
      if (!editingState) return;

      // Validate: don't save with empty name
      if (!item.name.trim()) {
        return;
      }

      // Validate: don't save with quantity <= 0
      if (item.quantity <= 0) {
        return;
      }

      // Validate: don't save with empty unit
      if (!item.unit?.trim()) {
        return;
      }

      // Convert back to ParsedIngredient
      const updatedIngredient = baseGroceryItemToParsedIngredient(
        item,
        editingState.originalCategory
      );

      // Call onSave with index and updated ingredient
      onSave(editingState.index, updatedIngredient);

      // Dismiss the sheet
      sheetRef.current?.dismiss();
    },
    [editingState, onSave]
  );

  const handleDismiss = useCallback(() => {
    setEditingState(null);
    onCancel?.();
  }, [onCancel]);

  return (
    <ItemSheetProvider
      mode="update"
      onSubmit={handleSubmit}
      setFromItemRef={setFromItemRef}
      disableAutocomplete={true}
    >
      <EditSheetContents
        sheetRef={sheetRef}
        editingState={editingState}
        onSave={onSave}
        onDismiss={handleDismiss}
      />
    </ItemSheetProvider>
  );
});

EditParsedIngredientSheet.displayName = 'EditParsedIngredientSheet';
