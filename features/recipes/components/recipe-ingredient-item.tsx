import { useRef } from 'react';
import { Pressable, View } from 'react-native';

import { CategoryTag } from '../../../components/category-tag';
import { formatQuantityUnit } from '../../../components/item-sheet/unit-utils';
import { ListItem } from '../../../components/ui/list-item';
import { Text } from '../../../components/ui/text';
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
  const notes = ingredient.notes?.trim();
  const pressStartXRef = useRef<number | null>(null);
  const shouldSuppressPressRef = useRef(false);

  const handlePress = () => {
    if (shouldSuppressPressRef.current) return;
    onEdit?.(ingredient);
  };

  return (
    <ListItem
      onDelete={
        canDelete
          ? () => removeItem({ ingredientId: ingredient.id })
          : undefined
      }
      className={className}
    >
      <Pressable
        className="flex-1 gap-1"
        onPress={handlePress}
        onPressIn={event => {
          pressStartXRef.current = event.nativeEvent.pageX;
          shouldSuppressPressRef.current = false;
        }}
        onTouchMove={event => {
          const pressStartX = pressStartXRef.current;
          if (pressStartX === null) return;
          const horizontalMovement = Math.abs(
            event.nativeEvent.pageX - pressStartX
          );
          if (horizontalMovement > 8) {
            shouldSuppressPressRef.current = true;
          }
        }}
        onPressOut={() => {
          pressStartXRef.current = null;
        }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-medium text-foreground">
            {ingredient.name}
          </Text>
          <Text className="text-lg text-muted-foreground">
            {formatQuantityUnit(ingredient.quantity, ingredient.unit)}
          </Text>
        </View>
        {notes ? (
          <Text className="text-base leading-none text-muted-foreground">
            {notes}
          </Text>
        ) : null}
        <View className="flex-row items-center gap-2">
          {ingredient.category && (
            <CategoryTag category={ingredient.category} />
          )}
        </View>
      </Pressable>
    </ListItem>
  );
};
