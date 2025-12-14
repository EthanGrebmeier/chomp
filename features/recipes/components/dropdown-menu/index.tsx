import { router } from 'expo-router';
import { ReactNode, useRef, useState } from 'react';
import { toast } from 'sonner-native';

import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '@/components/ui/dropdown-menu';
import { navigation } from '@/lib/navigation';

import {
  RecipeConflictSheet,
  RecipeConflictSheetRef,
} from '../../../grocery-list/components/recipe-conflict-sheet';
import {
  SelectGroceryListSheet,
  SelectGroceryListSheetRef,
} from '../../../grocery-lists/components/select-grocery-list-sheet';
import { useGroceryLists } from '../../../grocery-lists/instant/useGroceryLists';
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
  listId?: string;
};

export const RecipeDropdownMenu = ({
  trigger,
  recipe,
  listId,
}: RecipeDropdownMenuProps) => {
  const conflictSheetRef = useRef<RecipeConflictSheetRef>(null);
  const createRecipeSheetRef = useRef<CreateRecipeSheetRef>(null);
  const selectListSheetRef = useRef<SelectGroceryListSheetRef>(null);
  const [showConflict, setShowConflict] = useState(false);

  const { data: groceryLists } = useGroceryLists();
  const { mutate: addToList } = useAddRecipeToList();
  const { mutate: incrementQuantities, isPending: isIncrementing } =
    useIncrementRecipeQuantities();
  const { mutate: addAsSeparate, isPending: isAddingSeparate } =
    useAddRecipeAsSeparateItems();
  const { mutate: duplicateRecipe } = useDuplicateRecipe();
  const { mutate: deleteRecipe } = useDeleteRecipe();
  const { mutate: updateRecipe } = useUpdateRecipe();

  const performAddToList = (targetListId: string) => {
    addToList(
      { recipeId: recipe.id, listId: targetListId },
      {
        onSuccess: () => {
          router.push(navigation.goToList(targetListId));
          toast.success(`${recipe.name} added to list`);
        },
        onError: error => {
          console.error('Failed to add recipe to grocery list:', error);
          toast.error('Failed to add recipe');
        },
      }
    );
  };

  const handleAddToList = () => {
    // If listId prop provided, use it directly
    if (listId) {
      performAddToList(listId);
      return;
    }

    const lists = groceryLists?.grocery_lists ?? [];

    // If only one list, add directly to it
    if (lists.length === 1) {
      performAddToList(lists[0].id);
      return;
    }

    // Multiple lists (or none) - show selection sheet
    selectListSheetRef.current?.present();
  };

  const handleListSelected = (selectedListId: string) => {
    performAddToList(selectedListId);
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
    if (!listId) return;
    incrementQuantities(
      { recipeId: recipe.id, listId },
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
    if (!listId) return;
    addAsSeparate(
      { recipeId: recipe.id, listId },
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
      { recipeId: recipe.id, updates: { name: data.name } },
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
      <DropdownMenuRoot trigger={trigger}>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={handleAddToList} key="add-to-list">
            <DropdownMenuItemTitle>Add to List</DropdownMenuItemTitle>
            <DropdownMenuItemIcon ios={{ name: 'cart' }} />
          </DropdownMenuItem>

          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={() => createRecipeSheetRef.current?.present()}
              key="edit-recipe"
            >
              <DropdownMenuItemTitle>Edit Recipe</DropdownMenuItemTitle>
              <DropdownMenuItemIcon ios={{ name: 'pencil' }} />
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleDuplicate} key="duplicate">
              <DropdownMenuItemTitle>Duplicate Recipe</DropdownMenuItemTitle>
              <DropdownMenuItemIcon ios={{ name: 'doc.on.doc' }} />
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={handleDelete}
              destructive
              key="delete-recipe"
            >
              <DropdownMenuItemTitle>Delete Recipe</DropdownMenuItemTitle>
              <DropdownMenuItemIcon ios={{ name: 'trash' }} />
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenuRoot>
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
      <SelectGroceryListSheet
        ref={selectListSheetRef}
        selectedListId={undefined}
        onSelectList={handleListSelected}
      />
    </>
  );
};
