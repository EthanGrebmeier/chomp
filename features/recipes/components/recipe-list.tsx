import { Alert, FlatList, View } from 'react-native';

import {
  ContextMenuItem,
  ContextMenuItemTitle,
  ContextMenuRoot,
} from '../../../components/ui/context-menu';
import { ListItem } from '../../../components/ui/list-item';
import { cn } from '../../../lib/utils';
import { useDeleteRecipe } from '../hooks';
import { RecipeWithIngredients } from '../types';

import { EmptyRecipePrompt } from './empty-recipe-prompt';
import { RecipeCard } from './recipe-card';

type RecipeListProps = {
  recipes: RecipeWithIngredients[];
  listId?: string;
};

export const RecipeList = ({ recipes, listId }: RecipeListProps) => {
  const { mutate: deleteRecipe } = useDeleteRecipe();
  const handleDelete = (recipeId: string) => {
    deleteRecipe(recipeId);
  };
  const handleConfirmDelete = (recipe: RecipeWithIngredients) => {
    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${recipe.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDelete(recipe.id),
        },
      ]
    );
  };

  if (recipes.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <EmptyRecipePrompt />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerClassName="pb-24"
      data={recipes}
      renderItem={({ item, index }) => (
        <ContextMenuRoot
          trigger={
            <ListItem
              className={cn(
                index !== (recipes.length ?? 0) - 1
                  ? 'border-b border-dashed border-border'
                  : ''
              )}
              onDelete={() => handleDelete(item.id)}
            >
              <RecipeCard className="w-full" recipe={item} listId={listId} />
            </ListItem>
          }
        >
          <ContextMenuItem
            key={`delete-recipe-${item.id}`}
            destructive
            onSelect={() => handleConfirmDelete(item)}
          >
            <ContextMenuItemTitle>Delete Recipe</ContextMenuItemTitle>
          </ContextMenuItem>
        </ContextMenuRoot>
      )}
      keyExtractor={item => item.id}
    />
  );
};
