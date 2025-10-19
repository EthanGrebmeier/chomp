import { Pressable } from 'react-native';
import { ListItem } from '../../../components/ui/list-item';
import { Text } from '../../../components/ui/text';
import { useRemoveRecipeIngredient } from '../hooks/useRemoveRecipeIngredient';
import { RecipeIngredient as RecipeIngredientType } from '../types';

type RecipeIngredientItemProps = {
  ingredient: RecipeIngredientType;
  className?: string;
  onEdit?: (ingredient: RecipeIngredientType) => void;
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
        <Text>{ingredient.name}</Text>
        <Text className="text-muted-foreground">
          {ingredient.quantity} {ingredient.unit}
        </Text>
      </Pressable>
    </ListItem>
  );
};
