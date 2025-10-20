import { useQueryClient } from '@tanstack/react-query';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { CategorySelector } from '../../grocery-list/components/category-selector';
import { ItemFormData, ItemSheet, ItemSheetRef } from '../../shared/components';
import { useAddRecipeIngredient } from '../hooks/useAddRecipeIngredient';
import { useUpdateRecipeIngredient } from '../hooks/useUpdateRecipeIngredient';
import { recipeQueryKeys } from '../query-keys';
import { RecipeIngredientWithItem } from '../types';

type AddIngredientSheetProps = {
  recipeId: string;
  onClose?: () => void;
  defaultValues?: RecipeIngredientWithItem | null;
};

export type AddIngredientSheetRef = {
  present: () => void;
};

export const AddIngredientSheet = forwardRef<
  AddIngredientSheetRef,
  AddIngredientSheetProps
>(({ recipeId, onClose, defaultValues }, ref) => {
  const itemSheetRef = useRef<ItemSheetRef>(null);
  const { mutate: addIngredient } = useAddRecipeIngredient();
  const { mutate: updateIngredient } = useUpdateRecipeIngredient();
  const queryClient = useQueryClient();
  const isEditing = !!defaultValues;

  useImperativeHandle(ref, () => ({
    present: () => itemSheetRef.current?.present(),
  }));

  const handleSubmit = (data: ItemFormData) => {
    if (isEditing && defaultValues) {
      updateIngredient(
        {
          itemId: defaultValues.id,
          recipeId,
          updates: {
            name: data.name,
            quantity: parseInt(data.quantity),
            unit: data.unit,
            category: data.category === '' ? null : data.category || undefined,
          },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: recipeQueryKeys.all(),
            });
            onClose?.();
          },
        }
      );
    } else {
      addIngredient(
        {
          recipeId,
          name: data.name,
          quantity: parseInt(data.quantity),
          unit: data.unit,
          category: data.category === '' ? null : data.category || undefined,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: recipeQueryKeys.all(),
            });
            onClose?.();
          },
        }
      );
    }
  };

  const formData: ItemFormData | null = defaultValues
    ? {
        name: defaultValues.item?.name || '',
        quantity: defaultValues.item?.quantity?.toString() || '1',
        unit: defaultValues.item?.unit || 'each',
        category: defaultValues.item?.category || '',
      }
    : null;

  return (
    <ItemSheet
      ref={itemSheetRef}
      onClose={onClose}
      defaultValues={formData}
      onSubmit={handleSubmit}
      namePlaceholder="Ingredient Name"
      buttonText={isEditing ? 'Update Ingredient' : 'Add Ingredient'}
      categoryComponent={(category, onSelect) => (
        <CategorySelector category={category} onSelect={onSelect} />
      )}
    />
  );
});
