import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { memo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ContextMenuItem,
  ContextMenuItemTitle,
  ContextMenuRoot,
} from '../../../components/ui/context-menu';
import { SwipeToDelete } from '../../../components/ui/swipe-to-delete';
import { useDeleteRecipe } from '../hooks';
import { RecipeWithIngredients } from '../types';

import { EmptyRecipePrompt } from './empty-recipe-prompt';
import { RecipeBookSurface, RecipeRowSeparator } from './recipe-book-surface';
import { RecipeCard } from './recipe-card';

type RecipeRowProps = {
  recipe: RecipeWithIngredients;
  listId?: string;
  onDelete: (recipeId: string) => void;
};

// Memoized so filter/sort changes only render rows whose recipe changed,
// instead of re-rendering every native context menu and swipe gesture.
const RecipeRow = memo(function RecipeRow({
  recipe,
  listId,
  onDelete,
}: RecipeRowProps) {
  const handleDelete = () => onDelete(recipe.id);

  const handleConfirmDelete = () => {
    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${recipe.name}"? This also removes its planned meals and their unchecked grocery items.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDelete },
      ]
    );
  };

  return (
    <ContextMenuRoot
      trigger={
        <SwipeToDelete onDelete={handleDelete}>
          <RecipeCard recipe={recipe} listId={listId} />
        </SwipeToDelete>
      }
    >
      <ContextMenuItem
        key={`delete-recipe-${recipe.id}`}
        destructive
        onSelect={handleConfirmDelete}
      >
        <ContextMenuItemTitle>Delete Recipe</ContextMenuItemTitle>
      </ContextMenuItem>
    </ContextMenuRoot>
  );
});

type RecipeListProps = {
  recipes: RecipeWithIngredients[];
  listId?: string;
};

export const RecipeList = ({ recipes, listId }: RecipeListProps) => {
  const { mutate: deleteRecipe } = useDeleteRecipe();
  const { bottom } = useSafeAreaInsets();

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<RecipeWithIngredients>) => (
      <RecipeRow recipe={item} listId={listId} onDelete={deleteRecipe} />
    ),
    [deleteRecipe, listId]
  );

  return (
    <RecipeBookSurface>
      {recipes.length === 0 ? (
        <EmptyRecipePrompt listId={listId} />
      ) : (
        <FlashList
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: bottom + 16 }}
          scrollIndicatorInsets={{ bottom }}
          data={recipes}
          renderItem={renderItem}
          ItemSeparatorComponent={RecipeRowSeparator}
          keyExtractor={item => item.id}
          drawDistance={300}
        />
      )}
    </RecipeBookSurface>
  );
};
