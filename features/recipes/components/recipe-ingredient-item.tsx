import { Pressable, View } from 'react-native';

import { CategoryTag } from '../../../components/category-tag';
import { ListItem } from '../../../components/ui/list-item';
import { Text } from '../../../components/ui/text';
import { formatQuantityUnit } from '../../../components/item-sheet/unit-utils';
import { useRemoveRecipeIngredient } from '../hooks/useRemoveRecipeIngredient';
import { RecipeIngredient } from '../types';

type RecipeIngredientItemProps = {
  ingredient: RecipeIngredient;
  className?: string;
  onEdit?: (ingredient: RecipeIngredient) => void;
  canDelete?: boolean;
};

export const RecipeIngredientItem = ({
  ingredient,
  className,
  onEdit,
  canDelete = true,
}: RecipeIngredientItemProps) => {
  const { mutate: removeItem } = useRemoveRecipeIngredient();
  return (
    <ListItem
      onDelete={canDelete ? () => removeItem({ ingredientId: ingredient.id }) : undefined}
      className={className}
    >
      <Pressable className="flex-1 gap-1" onPress={() => onEdit?.(ingredient)}>
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-medium text-foreground">
            {ingredient.name}
          </Text>
          <Text className="text-lg text-muted-foreground">
            {formatQuantityUnit(ingredient.quantity, ingredient.unit)}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {ingredient.category && (
            <CategoryTag category={ingredient.category} />
          )}
        </View>
      </Pressable>
    </ListItem>
  );
};
