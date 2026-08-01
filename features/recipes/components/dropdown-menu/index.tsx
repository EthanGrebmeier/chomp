import { router } from 'expo-router';
import { ReactNode } from 'react';
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
import { buildRecipeShareURL, navigation } from '@/lib/navigation';

import { useDeleteRecipe } from '../../hooks/useDeleteRecipe';
import { useDuplicateRecipe } from '../../hooks/useDuplicateRecipe';
import { RecipeWithIngredients } from '../../types';

type RecipeDropdownMenuProps = {
  trigger: ReactNode;
  recipe: RecipeWithIngredients;
  listId?: string;
  onClose?: () => void;
};

export const RecipeDropdownMenu = ({
  trigger,
  recipe,
  listId,
  onClose,
}: RecipeDropdownMenuProps) => {
  const { user } = db.useAuth();

  // Check if current user owns the recipe
  const isOwner = recipe.user?.id === user?.id;
  const { mutate: duplicateRecipe } = useDuplicateRecipe();
  const { mutate: deleteRecipe } = useDeleteRecipe();

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

  const handleEditRecipe = () => {
    onClose?.();
    router.push(navigation.goToEditRecipe(recipe.id, listId));
  };

  return (
    <DropdownMenuRoot trigger={trigger}>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={handleShareRecipe} key="share-recipe">
            <DropdownMenuItemTitle>Share Recipe</DropdownMenuItemTitle>
            <DropdownMenuItemIcon ios={{ name: 'square.and.arrow.up' }} />
          </DropdownMenuItem>
          {isOwner ? (
            <DropdownMenuItem onSelect={handleEditRecipe} key="edit-recipe">
              <DropdownMenuItemTitle>Edit Recipe</DropdownMenuItemTitle>
              <DropdownMenuItemIcon ios={{ name: 'pencil' }} />
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onSelect={handleDuplicate} key="duplicate">
            <DropdownMenuItemTitle>Duplicate Recipe</DropdownMenuItemTitle>
            <DropdownMenuItemIcon ios={{ name: 'doc.on.doc' }} />
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {isOwner ? (
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
        ) : null}
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};
