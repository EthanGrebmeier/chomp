import { useRef } from 'react';
import { Platform, Pressable, View } from 'react-native';

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
  const compactTextStyle = Platform.select({
    android: { includeFontPadding: false },
    default: undefined,
  });
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
        className="flex-1 gap-1 py-1"
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
          <View className="flex-1 flex-row pr-2">
            <Text
              className="text-xl leading-[22px] tracking-tight text-foreground"
              style={compactTextStyle}
            >
              {ingredient.name}
              {'  '}
              <Text
                className="text-base leading-[22px] text-muted-foreground"
                style={compactTextStyle}
              >
                {formatQuantityUnit(ingredient.quantity, ingredient.unit)}
              </Text>
            </Text>
          </View>
          {ingredient.category && <CategoryTag category={ingredient.category} />}
        </View>
        {notes ? (
          <Text
            className="text-base leading-[18px] text-muted-foreground"
            style={compactTextStyle}
          >
            {notes}
          </Text>
        ) : null}
      </Pressable>
    </ListItem>
  );
};
