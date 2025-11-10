import { navigation } from '@/lib/navigation';
import { router } from 'expo-router';
import { ReactNode, useRef, useState } from 'react';
import { toast } from 'sonner-native';
import * as DropdownMenu from 'zeego/dropdown-menu';

import {
  RecipeConflictSheet,
  RecipeConflictSheetRef,
} from '../../../grocery-list/components/recipe-conflict-sheet';
import { useAddRecipeAsSeparateItems } from '../../hooks/useAddRecipeAsSeparateItems';
import { useAddRecipeToList } from '../../hooks/useAddRecipeToList';
import { useDeleteRecipe } from '../../hooks/useDeleteRecipe';
import { useDuplicateRecipe } from '../../hooks/useDuplicateRecipe';
import { useIncrementRecipeQuantities } from '../../hooks/useIncrementRecipeQuantities';

type RecipeDropdownMenuProps = {
  trigger: ReactNode;
  recipeId: string;
  recipeName: string;
};

export const RecipeDropdownMenu = ({
  trigger,
  recipeId,
  recipeName,
}: RecipeDropdownMenuProps) => {
  const conflictSheetRef = useRef<RecipeConflictSheetRef>(null);
  const [showConflict, setShowConflict] = useState(false);

  const { mutate: addToList } = useAddRecipeToList();
  const { mutate: incrementQuantities, isPending: isIncrementing } =
    useIncrementRecipeQuantities();
  const { mutate: addAsSeparate, isPending: isAddingSeparate } =
    useAddRecipeAsSeparateItems();
  const { mutate: duplicateRecipe } = useDuplicateRecipe();
  const { mutate: deleteRecipe } = useDeleteRecipe();

  const handleAddToList = () => {
    addToList(
      { recipeId },
      {
        onSuccess: result => {
          if (result.isDuplicate) {
            // Show conflict resolution sheet
            setShowConflict(true);
            conflictSheetRef.current?.present();
          } else {
            // Recipe added successfully, navigate to list
            router.push(navigation.goToList());
            toast.success(`${recipeName} added to list`);
          }
        },
        onError: error => {
          console.error('Failed to add recipe to grocery list:', error);
          toast.error('Failed to add recipe');
        },
      }
    );
  };

  const handleDuplicate = () => {
    duplicateRecipe(recipeId);
  };

  const handleDelete = () => {
    deleteRecipe(recipeId, {
      onSuccess: () => {
        router.push(navigation.goToRecipes());
      },
    });
  };

  const handleIncrementQuantities = () => {
    incrementQuantities(
      { recipeId },
      {
        onSuccess: () => {
          conflictSheetRef.current?.dismiss();
          setShowConflict(false);
          router.push(navigation.goToList());
          toast.success(`${recipeName} quantities incremented`);
        },
        onError: error => {
          console.error('Failed to increment quantities:', error);
          toast.error('Failed to increment quantities');
        },
      }
    );
  };

  const handleCreateSeparateItems = () => {
    addAsSeparate(
      { recipeId },
      {
        onSuccess: () => {
          conflictSheetRef.current?.dismiss();
          setShowConflict(false);
          router.push(navigation.goToList());
          toast.success(`${recipeName} added as separate items`);
        },
        onError: error => {
          console.error('Failed to add separate items:', error);
          toast.error('Failed to add separate items');
        },
      }
    );
  };

  const handleCancelConflict = () => {
    conflictSheetRef.current?.dismiss();
    setShowConflict(false);
  };

  const isPending = isIncrementing || isAddingSeparate;

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>{trigger}</DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item onSelect={handleAddToList} key="add-to-list">
            <DropdownMenu.ItemTitle>Add to List</DropdownMenu.ItemTitle>
            <DropdownMenu.ItemIcon ios={{ name: 'cart' }} />
          </DropdownMenu.Item>
          <DropdownMenu.Item onSelect={handleDuplicate} key="duplicate">
            <DropdownMenu.ItemTitle>Duplicate Recipe</DropdownMenu.ItemTitle>
            <DropdownMenu.ItemIcon ios={{ name: 'doc.on.doc' }} />
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={handleDelete}
            destructive
            key="delete-recipe"
          >
            <DropdownMenu.ItemTitle>Delete Recipe</DropdownMenu.ItemTitle>
            <DropdownMenu.ItemIcon ios={{ name: 'trash' }} />
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <RecipeConflictSheet
        ref={conflictSheetRef}
        recipeName={recipeName}
        onIncrement={handleIncrementQuantities}
        onCreateSeparate={handleCreateSeparateItems}
        onCancel={handleCancelConflict}
        isPending={isPending}
      />
    </>
  );
};

