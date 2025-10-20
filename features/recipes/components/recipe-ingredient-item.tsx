import { Pressable } from 'react-native';
import { ListItem } from '../../../components/ui/list-item';
import { Text } from '../../../components/ui/text';
import { useRemoveRecipeIngredient } from '../hooks/useRemoveRecipeIngredient';
import { RecipeIngredientWithItem } from '../types';

type RecipeIngredientItemProps = {
  ingredient: RecipeIngredientWithItem;
  className?: string;
  onEdit?: (ingredient: RecipeIngredientWithItem) => void;
};

export const RecipeIngredientItem = ({
  ingredient,
  className,
  onEdit,
}: RecipeIngredientItemProps) => {
  const { mutate: removeItem } = useRemoveRecipeIngredient();
  return (
    <ListItem
      onDelete={() =>
        removeItem({ itemId: ingredient.id, recipeId: ingredient.recipeId })
      }
      className={className}
    >
      <Pressable
        className="flex-1 flex-row justify-between"
        onPress={() => onEdit?.(ingredient)}
      >
        <Text>{ingredient.item.name}</Text>
        <Text className="text-muted-foreground">
          {ingredient.item.quantity} {ingredient.item.unit}
        </Text>
      </Pressable>
    </ListItem>
  );
};
