import { Pressable, View } from 'react-native';

import { CategoryTag } from '@/components/category-tag';
import { ListItem } from '@/components/ui/list-item';
import { Text } from '@/components/ui/text';

import { cn } from '../../../../lib/utils';
import { ParsedIngredient } from '../../api/types';

export type IngredientListPreviewProps = {
  ingredients: ParsedIngredient[];
  onRemove: (index: number) => void;
  onEdit?: (index: number, ingredient: ParsedIngredient) => void;
};

/**
 * Format an ingredient for display.
 * Examples: "2 cups flour (sifted)", "1 chicken breast", "salt (to taste)"
 */
const formatIngredient = (ingredient: ParsedIngredient): string => {
  const parts: string[] = [];

  // Add quantity if present
  if (ingredient.quantity !== null) {
    parts.push(String(ingredient.quantity));
  }

  // Add unit if present and not empty
  if (ingredient.unit?.trim()) {
    parts.push(ingredient.unit);
  }

  // Add name
  parts.push(ingredient.name);
  return parts.join(' ');
};

export const IngredientListPreview = ({
  ingredients,
  onRemove,
  onEdit,
}: IngredientListPreviewProps) => {
  if (ingredients.length === 0) {
    return (
      <View className="items-center justify-center py-8">
        <Text className="text-base text-muted-foreground">
          No ingredients to import
        </Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          All ingredients have been removed
        </Text>
      </View>
    );
  }

  return (
    <View>
      <View className="mb-2">
        <Text className="text-xl font-semibold text-foreground">
          Ingredients ({ingredients.length})
        </Text>
        <Text className="text-xs text-muted-foreground">
          {onEdit
            ? 'Tap to edit, swipe left to remove'
            : 'Swipe left to remove an ingredient'}
        </Text>
      </View>
      {ingredients.map((ingredient, index) => (
        <ListItem
          key={`${ingredient.name}-${index}`}
          onDelete={() => onRemove(index)}
          className={cn(
            ' border-b border-dashed border-border px-0',
            index === ingredients.length - 1 && 'border-b-0'
          )}
        >
          <Pressable
            className="flex-1 gap-1 "
            onPress={() => onEdit?.(index, ingredient)}
            disabled={!onEdit}
            accessibilityLabel={`Edit ingredient: ${ingredient.name}`}
            accessibilityRole="button"
            style={({ pressed }) => ({
              opacity: pressed && onEdit ? 0.7 : 1,
            })}
          >
            <Text className="text-base leading-[18px] text-foreground">
              {formatIngredient(ingredient)}
            </Text>
            {ingredient.notes && (
              <Text className="text-xs leading-3 text-muted-foreground">
                {ingredient.notes}
              </Text>
            )}
            {ingredient.category && (
              <View className="flex-row">
                <CategoryTag category={ingredient.category} />
              </View>
            )}
          </Pressable>
        </ListItem>
      ))}
    </View>
  );
};
