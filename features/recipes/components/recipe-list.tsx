import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { memo, useCallback } from 'react';
import { Alert, View } from 'react-native';

import {
  ContextMenuItem,
  ContextMenuItemTitle,
  ContextMenuRoot,
} from '../../../components/ui/context-menu';
import { ListItem } from '../../../components/ui/list-item';
import { useDeleteRecipe } from '../hooks';
import { RecipeWithIngredients } from '../types';

import { EmptyRecipePrompt } from './empty-recipe-prompt';
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
        <ListItem onDelete={handleDelete}>
          <RecipeCard recipe={recipe} listId={listId} />
        </ListItem>
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

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<RecipeWithIngredients>) => (
      <RecipeRow recipe={item} listId={listId} onDelete={deleteRecipe} />
    ),
    [deleteRecipe, listId]
  );

  if (recipes.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <EmptyRecipePrompt />
      </View>
    );
  }

  return (
    <FlashList
      keyboardDismissMode="on-drag"
      contentContainerClassName="pb-24"
      data={recipes}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      drawDistance={300}
    />
  );
};
