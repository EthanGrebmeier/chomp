import { Pressable, View } from 'react-native';
import { CategoryTag } from '../../../components/category-tag';
import { ListItem } from '../../../components/ui/list-item';
import { Text } from '../../../components/ui/text';
import { useRemoveRecipeIngredient } from '../hooks/useRemoveRecipeIngredient';
import { RecipeIngredient } from '../types';

type RecipeIngredientItemProps = {
  ingredient: RecipeIngredient;
  className?: string;
  onEdit?: (ingredient: RecipeIngredient) => void;
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
            {ingredient.name}
          </Text>
          <Text className="text-lg text-muted-foreground">
            {ingredient.unit === 'each' && 'x'}
            {ingredient.quantity}
            {ingredient.unit !== 'each' && ` ${ingredient.unit}`}
          </Text>
        </View>
        <View className="flex-row items-center justify-end gap-2">
          {ingredient.category && (
            <CategoryTag category={ingredient.category} />
          )}
        </View>
      </Pressable>
    </ListItem>
  );
};
