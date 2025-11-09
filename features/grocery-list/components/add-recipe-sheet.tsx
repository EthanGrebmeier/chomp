import { BottomSheetModal, useBottomSheetModal } from '@gorhom/bottom-sheet';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { KeyboardController } from 'react-native-keyboard-controller';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { RecipeSearch } from '../../recipes/components/recipe-search';
import { useAddRecipeAsSeparateItems } from '../../recipes/hooks/useAddRecipeAsSeparateItems';
import { useAddRecipeToList } from '../../recipes/hooks/useAddRecipeToList';
import { useIncrementRecipeQuantities } from '../../recipes/hooks/useIncrementRecipeQuantities';
import { RecipeWithIngredients } from '../../recipes/types';

import {
  RecipeConflictSheet,
  RecipeConflictSheetRef,
} from './recipe-conflict-sheet';

export type AddRecipeSheetRef = {
  present: () => void;
  dismiss: () => void;
};

export const AddRecipeSheet = forwardRef<AddRecipeSheetRef>((props, ref) => {
  const sheetRef = useRef<BottomSheetModal>(null);

  useImperativeHandle(ref, () => ({
    present: () => sheetRef.current?.present(),
    dismiss: () => sheetRef.current?.dismiss(),
  }));
  const conflictSheetRef = useRef<RecipeConflictSheetRef>(null);
  const [selectedRecipe, setSelectedRecipe] =
    useState<RecipeWithIngredients | null>(null);

  const { dismissAll } = useBottomSheetModal();

  const { mutate: addRecipeToList, isPending: isAddingRecipe } =
    useAddRecipeToList();
  const { mutate: incrementQuantities, isPending: isIncrementing } =
    useIncrementRecipeQuantities();
  const { mutate: addAsSeparate, isPending: isAddingSeparate } =
    useAddRecipeAsSeparateItems();

  const handleRecipeSelect = (recipe: RecipeWithIngredients) => {
    setSelectedRecipe(recipe);
    addRecipeToList(
      {
        recipeId: recipe.id,
      },
      {
        onSuccess: result => {
          if (result.isDuplicate) {
            // Show conflict resolution sheet
            conflictSheetRef.current?.present();
          } else {
            // Recipe added successfully
            sheetRef.current?.dismiss();
          }
        },
      }
    );
  };

  const handleIncrementQuantities = () => {
    if (!selectedRecipe) return;

    incrementQuantities(
      {
        recipeId: selectedRecipe.id,
      },
      {
        onSuccess: () => {
          dismissAll();
          toast.success(`${selectedRecipe.name} added`);
        },
      }
    );
  };

  const handleCreateSeparateItems = () => {
    if (!selectedRecipe) return;

    addAsSeparate(
      {
        recipeId: selectedRecipe.id,
      },
      {
        onSuccess: () => {
          dismissAll();
          toast.success(`${selectedRecipe.name} added`);
        },
      }
    );
  };

  const handleCancelConflict = () => {
    conflictSheetRef.current?.dismiss();
    setSelectedRecipe(null);
  };

  const isPending = isAddingRecipe || isIncrementing || isAddingSeparate;

  return (
    <>
      <BottomSheet
        onStartClose={() => KeyboardController.dismiss()}
        ref={sheetRef}
      >
        <RecipeSearch
          sheetRef={sheetRef}
          canGoBack={false}
          onItemSelect={handleRecipeSelect}
          onBack={() => {}}
        />
      </BottomSheet>
      <RecipeConflictSheet
        ref={conflictSheetRef}
        recipeName={selectedRecipe?.name ?? ''}
        onIncrement={handleIncrementQuantities}
        onCreateSeparate={handleCreateSeparateItems}
        onCancel={handleCancelConflict}
        isPending={isPending}
      />
    </>
  );
});

AddRecipeSheet.displayName = 'AddRecipeSheet';
