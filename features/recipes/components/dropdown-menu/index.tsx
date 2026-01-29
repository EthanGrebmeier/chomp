import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { router } from 'expo-router';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { Share } from 'react-native';
import { toast } from 'sonner-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { IngredientSelector } from '@/components/item-sheet/add-item/ingredient-selector';
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '@/components/ui/dropdown-menu';
import { db } from '@/lib/instant';
import { buildRecipeShareURL, navigation } from '@/lib/navigation';

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
import { useDeleteRecipe } from '../../hooks/useDeleteRecipe';
import { useDuplicateRecipe } from '../../hooks/useDuplicateRecipe';
import { useIncrementRecipeQuantities } from '../../hooks/useIncrementRecipeQuantities';
import { useUpdateRecipe } from '../../hooks/useUpdateRecipe';
import { RecipeWithIngredients } from '../../types';
import {
  CreateRecipeSheet,
  CreateRecipeSheetRef,
} from '../create-recipe-sheet';

type RecipeDropdownMenuProps = {
  trigger: ReactNode;
  recipe: RecipeWithIngredients;
  listId?: string;
};

export const RecipeDropdownMenu = ({
  trigger,
  recipe,
  listId,
}: RecipeDropdownMenuProps) => {
  const { user } = db.useAuth();
  const conflictSheetRef = useRef<RecipeConflictSheetRef>(null);
  const createRecipeSheetRef = useRef<CreateRecipeSheetRef>(null);
  const selectListSheetRef = useRef<SelectGroceryListSheetRef>(null);
  const ingredientSelectorSheetRef = useRef<TrueSheet>(null);
  const [showConflict, setShowConflict] = useState(false);
  const [selectedListIdForIngredients, setSelectedListIdForIngredients] =
    useState<string | null>(null);

  const { data: groceryLists } = useGroceryLists();

  // Check if current user owns the recipe
  const isOwner = recipe.user?.id === user?.id;
  const { mutate: incrementQuantities, isPending: isIncrementing } =
    useIncrementRecipeQuantities();
  const { mutate: addAsSeparate, isPending: isAddingSeparate } =
    useAddRecipeAsSeparateItems();
  const { mutate: duplicateRecipe } = useDuplicateRecipe();
  const { mutate: deleteRecipe } = useDeleteRecipe();
  const { mutate: updateRecipe } = useUpdateRecipe();

  const handleIngredientSelectorComplete = () => {
    const listIdToNavigate = selectedListIdForIngredients;
    ingredientSelectorSheetRef.current?.dismiss();
    setSelectedListIdForIngredients(null);
    if (listIdToNavigate) {
      router.push(navigation.goToList(listIdToNavigate));
    }
  };

  const handleIngredientSelectorDismiss = () => {
    setSelectedListIdForIngredients(null);
  };

  const handleIngredientSelectorBack = () => {
    ingredientSelectorSheetRef.current?.dismiss();
    setSelectedListIdForIngredients(null);
    // If we came from list selection, show it again
    if (!listId) {
      const lists = groceryLists?.grocery_lists ?? [];
      if (lists.length > 1) {
        selectListSheetRef.current?.present();
      }
    }
  };

  const showIngredientSelector = (targetListId: string) => {
    setSelectedListIdForIngredients(targetListId);
  };

  // Present the sheet when a list ID is selected
  useEffect(() => {
    if (selectedListIdForIngredients) {
      ingredientSelectorSheetRef.current?.present();
    }
  }, [selectedListIdForIngredients]);

  const handleAddToList = () => {
    // If listId prop provided, show ingredient selector directly
    if (listId) {
      showIngredientSelector(listId);
      return;
    }

    const lists = groceryLists?.grocery_lists ?? [];

    // If only one list, show ingredient selector directly
    if (lists.length === 1) {
      showIngredientSelector(lists[0].id);
      return;
    }

    // Multiple lists (or none) - show selection sheet first
    selectListSheetRef.current?.present();
  };

  const handleListSelected = (selectedListId: string) => {
    showIngredientSelector(selectedListId);
  };

  const handleDuplicate = () => {
    duplicateRecipe({
      name: recipe.name,
      description: recipe.description,
      imageSrc: recipe.imageSrc,
      visibility: recipe.visibility,
      ingredients: recipe.recipe_ingredients,
    });
  };

  const handleShareRecipe = async () => {
    const shareUrl = buildRecipeShareURL(recipe.id);
    if (!shareUrl) {
      toast.error('Recipe sharing is unavailable right now');
      return;
    }

    try {
      const result = await Share.share({
        message: `Check out this recipe: ${shareUrl}`,
      });

      if (result.action === Share.sharedAction) {
        toast.success('Recipe link shared');
      }
    } catch (error) {
      toast.error('Failed to share recipe link');
      console.error('Error sharing recipe link:', error);
    }
  };

  const handleDelete = () => {
    deleteRecipe(recipe.id, {
      onSuccess: () => {
        router.replace(navigation.goToRecipes());
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
    // Transform ingredients to include storeId from store object
    const ingredients = recipe.recipe_ingredients.map(ingredient => ({
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      notes: ingredient.notes ?? null,
      category: ingredient.category ?? null,
      storeId: ingredient.store?.id,
    }));

    addAsSeparate(
      {
        recipeId: recipe.id,
        listId,
        ingredients,
      },
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

  const handleEditRecipe = (data: {
    name: string;
    mealTag?: string;
    description?: string;
    sourceUrl?: string;
  }) => {
    updateRecipe(
      {
        recipeId: recipe.id,
        updates: {
          name: data.name,
          mealTag: data.mealTag,
          description: data.description,
          sourceUrl: data.sourceUrl,
        },
      },
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
          {isOwner && (
            <DropdownMenuItem onSelect={handleAddToList} key="add-to-list">
              <DropdownMenuItemTitle>Add to List</DropdownMenuItemTitle>
              <DropdownMenuItemIcon ios={{ name: 'cart' }} />
            </DropdownMenuItem>
          )}

          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={handleShareRecipe} key="share-recipe">
              <DropdownMenuItemTitle>Share Recipe</DropdownMenuItemTitle>
              <DropdownMenuItemIcon ios={{ name: 'square.and.arrow.up' }} />
            </DropdownMenuItem>
            {isOwner && (
              <DropdownMenuItem
                onSelect={() => createRecipeSheetRef.current?.present()}
                key="edit-recipe"
              >
                <DropdownMenuItemTitle>Edit Recipe</DropdownMenuItemTitle>
                <DropdownMenuItemIcon ios={{ name: 'pencil' }} />
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={handleDuplicate} key="duplicate">
              <DropdownMenuItemTitle>Duplicate Recipe</DropdownMenuItemTitle>
              <DropdownMenuItemIcon ios={{ name: 'doc.on.doc' }} />
            </DropdownMenuItem>
          </DropdownMenuGroup>
          {isOwner && (
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
          )}
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
        defaultValues={{
          name: recipe.name,
          mealTag: recipe.mealTag,
          description: recipe.description,
          sourceUrl: recipe.sourceUrl,
        }}
      />
      <SelectGroceryListSheet
        ref={selectListSheetRef}
        selectedListId={undefined}
        onSelectList={handleListSelected}
      />
      <BottomSheet
        detents={['auto']}
        name="recipe-ingredient-selector-sheet"
        ref={ingredientSelectorSheetRef}
        onStartClose={handleIngredientSelectorDismiss}
        scrollable
        viewClassName="flex-1"
      >
        {selectedListIdForIngredients && (
          <IngredientSelector
            recipe={recipe}
            listId={selectedListIdForIngredients}
            onBack={handleIngredientSelectorBack}
            onComplete={handleIngredientSelectorComplete}
            onDismiss={() => ingredientSelectorSheetRef.current?.dismiss()}
          />
        )}
      </BottomSheet>
    </>
  );
};
