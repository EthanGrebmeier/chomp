import { Pressable, View } from 'react-native';
import { CategoryTag } from '../../../components/category-tag';
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
      <Pressable className="flex-1 " onPress={() => onEdit?.(ingredient)}>
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-medium text-foreground">
            {ingredient.item.name}
          </Text>
          <Text className="text-lg text-muted-foreground">
            {ingredient.item.unit === 'each' && 'x'}
            {ingredient.item.quantity}
            {ingredient.item.unit !== 'each' && ` ${ingredient.item.unit}`}
          </Text>
        </View>
        <View className="flex-row items-center justify-end gap-2">
          {ingredient.item.category && (
            <CategoryTag category={ingredient.item.category} />
          )}
        </View>
      </Pressable>
    </ListItem>
  );
};
