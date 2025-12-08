import { forwardRef, useImperativeHandle, useRef } from 'react';

import { ItemFormData, ItemSheet, ItemSheetRef } from '../../shared/components';
import { GroceryListItemWithRecipe } from '../types';

import { CategorySelector } from './category-selector';

type UpdateItemSheetProps = {
  onClose?: () => void;
  defaultValues: GroceryListItemWithRecipe | null;
  showButton?: boolean;
  onUpdate: (data: ItemFormData) => void;
};

export type UpdateItemSheetRef = {
  present: () => void;
  dismiss: () => void;
};

export const UpdateItemSheet = forwardRef<
  UpdateItemSheetRef,
  UpdateItemSheetProps
>(({ onClose, defaultValues, showButton = true, onUpdate }, ref) => {
  const itemSheetRef = useRef<ItemSheetRef>(null);

  const isEditing = !!defaultValues;

  useImperativeHandle(ref, () => ({
    present: () => itemSheetRef.current?.present(),
    dismiss: () => itemSheetRef.current?.dismiss(),
  }));

  const formData: ItemFormData | null = defaultValues
    ? {
        name: defaultValues.name,
        quantity: defaultValues.quantity?.toString() || '1',
        unit: defaultValues.unit,
        category: defaultValues.category ?? '',
      }
    : null;

  return (
    <ItemSheet
      showAddButton={showButton}
      ref={itemSheetRef}
      sheetName="edit-grocery-item-sheet"
      onClose={onClose}
      defaultValues={formData}
      onSubmit={onUpdate}
      namePlaceholder="Name"
      buttonText={isEditing ? 'Update Item' : 'Add Item'}
      categoryComponent={(category, onSelect) => (
        <CategorySelector category={category} onSelect={onSelect} />
      )}
    />
  );
});

UpdateItemSheet.displayName = 'EditItemSheet';
