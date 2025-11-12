import { useQueryClient } from '@tanstack/react-query';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { toast } from 'sonner-native';

import { ItemFormData, ItemSheet, ItemSheetRef } from '../../shared/components';
import { useAddGroceryItem } from '../hooks/useAddGroceryListItem';
import { useUpdateGroceryListItem } from '../hooks/useUpdateGroceryListItem';
import { queryKeys } from '../query-keys';
import { GroceryListItemWithRecipe } from '../types';

import { CategorySelector } from './category-selector';

type AddItemSheetProps = {
  onClose?: () => void;
  defaultValues: GroceryListItemWithRecipe | null;
  showButton?: boolean;
};

export type AddItemSheetRef = {
  present: () => void;
};

export const AddItemSheet = forwardRef<AddItemSheetRef, AddItemSheetProps>(
  ({ onClose, defaultValues, showButton = true }, ref) => {
    const itemSheetRef = useRef<ItemSheetRef>(null);
    const { mutate: addItem } = useAddGroceryItem();
    const { mutate: updateItem } = useUpdateGroceryListItem();
    const queryClient = useQueryClient();
    const isEditing = !!defaultValues;

    useImperativeHandle(ref, () => ({
      present: () => itemSheetRef.current?.present(),
    }));

    const handleSubmit = (data: ItemFormData) => {
      if (isEditing && defaultValues) {
        updateItem(
          {
            itemId: defaultValues.id,
            updates: {
              name: data.name,
              unit: data.unit,
              quantity: parseInt(data.quantity),
              category:
                data.category === '' ? null : (data.category ?? undefined),
            },
          },
          {
            onSuccess: () => {
              itemSheetRef.current?.dismiss();
              queryClient.invalidateQueries({ queryKey: queryKeys.items() });
              toast.success(`${defaultValues.name} updated`);
            },
          }
        );
      } else {
        addItem(
          {
            name: data.name,
            unit: data.unit,
            quantity: parseInt(data.quantity),
            category:
              data.category === '' ? null : (data.category ?? undefined),
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: queryKeys.items() });
              toast.success(`${data.name} added`);
            },
          }
        );
      }
    };

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
        sheetName="add-grocery-item-sheet"
        onClose={onClose}
        defaultValues={formData}
        onSubmit={handleSubmit}
        namePlaceholder="Name"
        buttonText={isEditing ? 'Update Item' : 'Add Item'}
        categoryComponent={(category, onSelect) => (
          <CategorySelector category={category} onSelect={onSelect} />
        )}
      />
    );
  }
);

AddItemSheet.displayName = 'AddItemSheet';
