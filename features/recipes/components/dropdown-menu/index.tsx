import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ReactNode, useRef, useState } from 'react';
import { toast } from 'sonner-native';
import * as DropdownMenu from 'zeego/dropdown-menu';

import { navigation } from '@/lib/navigation';

import {
  RecipeConflictSheet,
  RecipeConflictSheetRef,
} from '../../../grocery-list/components/recipe-conflict-sheet';
import { useAddRecipeAsSeparateItems } from '../../hooks/useAddRecipeAsSeparateItems';
import { useAddRecipeToList } from '../../hooks/useAddRecipeToList';
import { useDeleteRecipe } from '../../hooks/useDeleteRecipe';
import { useDuplicateRecipe } from '../../hooks/useDuplicateRecipe';
import { useIncrementRecipeQuantities } from '../../hooks/useIncrementRecipeQuantities';
import { useUpdateRecipe } from '../../hooks/useUpdateRecipe';
import { Recipe } from '../../types';
import {
  CreateRecipeSheet,
  CreateRecipeSheetRef,
} from '../create-recipe-sheet';

type RecipeDropdownMenuProps = {
  trigger: ReactNode;
  recipe: Recipe;
};

export const RecipeDropdownMenu = ({
  trigger,
  recipe,
}: RecipeDropdownMenuProps) => {
  const conflictSheetRef = useRef<RecipeConflictSheetRef>(null);
  const createRecipeSheetRef = useRef<CreateRecipeSheetRef>(null);
  const [showConflict, setShowConflict] = useState(false);

  const { mutate: addToList } = useAddRecipeToList();
  const { mutate: incrementQuantities, isPending: isIncrementing } =
    useIncrementRecipeQuantities();
  const { mutate: addAsSeparate, isPending: isAddingSeparate } =
    useAddRecipeAsSeparateItems();
  const { mutate: duplicateRecipe } = useDuplicateRecipe();
  const { mutate: deleteRecipe } = useDeleteRecipe();
  const { mutate: updateRecipe } = useUpdateRecipe();

  const handleAddToList = () => {
    addToList(
      { recipeId: recipe.id },
      {
        onSuccess: result => {
          if (result.isDuplicate) {
            // Show conflict resolution sheet
            setShowConflict(true);
            conflictSheetRef.current?.present();
          } else {
            // Recipe added successfully, navigate to list
            router.push(navigation.goToList());
            toast.success(`${recipe.name} added to list`);
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
    duplicateRecipe(recipe.id);
  };

  const handleDelete = () => {
    deleteRecipe(recipe.id, {
      onSuccess: () => {
        router.push(navigation.goToRecipes());
      },
    });
  };

  const handleIncrementQuantities = () => {
    incrementQuantities(
      { recipeId: recipe.id },
      {
        onSuccess: () => {
          conflictSheetRef.current?.dismiss();
          setShowConflict(false);
          router.push(navigation.goToList());
          toast.success(`${recipe.name} quantities incremented`);
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
      { recipeId: recipe.id },
      {
        onSuccess: () => {
          conflictSheetRef.current?.dismiss();
          setShowConflict(false);
          router.push(navigation.goToList());
          toast.success(`${recipe.name} added as separate items`);
        },
        onError: error => {
          console.error('Failed to add separate items:', error);
          toast.error('Failed to add separate items');
        },
      }
    );
  };

  const handleEditRecipe = (data: { name: string }) => {
    updateRecipe(
      { recipe: { ...recipe, name: data.name } },
      {
        onSuccess: () => {
          toast.success('Recipe updated');
        },
        onError: error => {
          console.error('Failed to update recipe:', error);
          toast.error('Failed to update recipe');
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
        <DropdownMenu.Trigger
          onClick={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
          {trigger}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item onSelect={handleAddToList} key="add-to-list">
            <DropdownMenu.ItemTitle>Add to List</DropdownMenu.ItemTitle>
            <DropdownMenu.ItemIcon ios={{ name: 'cart' }} />
          </DropdownMenu.Item>

          <DropdownMenu.Group>
            <DropdownMenu.Item
              onSelect={() => createRecipeSheetRef.current?.present()}
              key="edit-recipe"
            >
              <DropdownMenu.ItemTitle>Edit Recipe</DropdownMenu.ItemTitle>
              <DropdownMenu.ItemIcon ios={{ name: 'pencil' }} />
            </DropdownMenu.Item>
            <DropdownMenu.Item onSelect={handleDuplicate} key="duplicate">
              <DropdownMenu.ItemTitle>Duplicate Recipe</DropdownMenu.ItemTitle>
              <DropdownMenu.ItemIcon ios={{ name: 'doc.on.doc' }} />
            </DropdownMenu.Item>
          </DropdownMenu.Group>
          <DropdownMenu.Group>
            <DropdownMenu.Item
              onSelect={handleDelete}
              destructive
              key="delete-recipe"
            >
              <DropdownMenu.ItemTitle>Delete Recipe</DropdownMenu.ItemTitle>
              <DropdownMenu.ItemIcon ios={{ name: 'trash' }} />
            </DropdownMenu.Item>
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <RecipeConflictSheet
        ref={conflictSheetRef}
        recipeName={recipe.name}
        onIncrement={handleIncrementQuantities}
        onCreateSeparate={handleCreateSeparateItems}
        onCancel={handleCancelConflict}
        isPending={isPending}
      />
      <CreateRecipeSheet
        ref={createRecipeSheetRef}
        onSubmit={handleEditRecipe}
        defaultValues={{ name: recipe.name }}
      />
    </>
  );
};
