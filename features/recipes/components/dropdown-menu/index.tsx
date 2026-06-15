import { router } from 'expo-router';
import { ReactNode, useRef } from 'react';
import { Alert, Share } from 'react-native';
import { toast } from 'sonner-native';

import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '@/components/ui/dropdown-menu';
import { db } from '@/lib/instant';
import { buildRecipeShareURL } from '@/lib/navigation';

import { useDeleteRecipe } from '../../hooks/useDeleteRecipe';
import { useDuplicateRecipe } from '../../hooks/useDuplicateRecipe';
import { useUpdateRecipe } from '../../hooks/useUpdateRecipe';
import { RecipeWithIngredients } from '../../types';
import {
  CreateRecipeSheet,
  CreateRecipeSheetRef,
} from '../create-recipe-sheet';

type RecipeDropdownMenuProps = {
  trigger: ReactNode;
  recipe: RecipeWithIngredients;
  onClose?: () => void;
};

export const RecipeDropdownMenu = ({
  trigger,
  recipe,
  onClose,
}: RecipeDropdownMenuProps) => {
  const { user } = db.useAuth();
  const createRecipeSheetRef = useRef<CreateRecipeSheetRef>(null);

  // Check if current user owns the recipe
  const isOwner = recipe.user?.id === user?.id;
  const { mutate: duplicateRecipe } = useDuplicateRecipe();
  const { mutate: deleteRecipe } = useDeleteRecipe();
  const { mutate: updateRecipe } = useUpdateRecipe();

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
      await Share.share({
        url: shareUrl,
      });
    } catch {
      toast.error('Failed to share recipe link');
    }
  };

  const handleDelete = () => {
    // Navigate away immediately so we do not briefly render the deleted recipe state.
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
    deleteRecipe(recipe.id, {
      onError: () => {
        toast.error('Failed to delete recipe');
      },
    });
  };

  const handleConfirmDelete = () => {
    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${recipe.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDelete },
      ]
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
        onError: () => {
          toast.error('Failed to update recipe');
        },
      }
    );
  };
  return (
    <>
      <DropdownMenuRoot trigger={trigger}>
        <DropdownMenuContent>
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
                onSelect={handleConfirmDelete}
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
    </>
  );
};
