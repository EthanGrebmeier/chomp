import { FlatList, View } from 'react-native';

import { EmptyHeading } from '../../../components/text/empty-heading';
import { EmptySubtext } from '../../../components/text/empty-subtext';
import { ListItem } from '../../../components/ui/list-item';
import { cn } from '../../../lib/utils';
import { useDeleteRecipe } from '../hooks';
import { RecipeWithIngredients } from '../types';

import { RecipeCard } from './recipe-card';

type RecipeListProps = {
  recipes: RecipeWithIngredients[];
};

export const RecipeList = ({ recipes }: RecipeListProps) => {
  const { mutate: deleteRecipe } = useDeleteRecipe();
  const handleDelete = (recipeId: string) => {
    deleteRecipe(recipeId);
  };

  if (recipes.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <EmptyHeading>No recipes yet</EmptyHeading>
        <EmptySubtext>Create your first recipe to get started!</EmptySubtext>
      </View>
    );
  }

  return (
    <FlatList
      data={recipes}
      renderItem={({ item, index }) => (
        <ListItem
          className={cn(
            index !== (recipes.length ?? 0) - 1
              ? 'border-b border-dashed border-border'
              : ''
          )}
          onDelete={() => handleDelete(item.id)}
        >
          <RecipeCard className="w-full" recipe={item} />
        </ListItem>
      )}
      keyExtractor={item => item.id}
    />
  );
};
