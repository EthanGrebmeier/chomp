import { Button } from '@/components/ui/button';
import { BottomSheetModal, useBottomSheetModal } from '@gorhom/bottom-sheet';
import { useRef, useState } from 'react';
import { KeyboardController } from 'react-native-keyboard-controller';
import { toast } from 'sonner-native';
import { BottomSheet } from '../../../components/bottom-sheet';
import { Text } from '../../../components/ui/text';
import { RecipeSearch } from '../../recipes/components/recipe-search';
import { useAddRecipeAsSeparateItems } from '../../recipes/hooks/useAddRecipeAsSeparateItems';
import { useAddRecipeToList } from '../../recipes/hooks/useAddRecipeToList';
import { useIncrementRecipeQuantities } from '../../recipes/hooks/useIncrementRecipeQuantities';
import { RecipeWithIngredients } from '../../recipes/types';
import {
  RecipeConflictSheet,
  RecipeConflictSheetRef,
} from './recipe-conflict-sheet';

type AddRecipeSheetProps = {
  groceryListId: string;
};

export const AddRecipeSheet = ({ groceryListId }: AddRecipeSheetProps) => {
  const ref = useRef<BottomSheetModal>(null);
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
        groceryListId,
      },
      {
        onSuccess: result => {
          if (result.isDuplicate) {
            // Show conflict resolution sheet
            conflictSheetRef.current?.present();
          } else {
            // Recipe added successfully
            ref.current?.dismiss();
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
        groceryListId,
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
        groceryListId,
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
      <Button size="sm" onPress={() => ref.current?.present()}>
        <Text>Add Recipe</Text>
      </Button>
      <BottomSheet onStartClose={() => KeyboardController.dismiss()} ref={ref}>
        <RecipeSearch
          sheetRef={ref}
          canGoBack={false}
          onItemSelect={handleRecipeSelect}
          onBack={() => {}}
        />
      </BottomSheet>
      <RecipeConflictSheet
        ref={conflictSheetRef}
        recipeName={selectedRecipe?.name || ''}
        onIncrement={handleIncrementQuantities}
        onCreateSeparate={handleCreateSeparateItems}
        onCancel={handleCancelConflict}
        isPending={isPending}
      />
    </>
  );
};
