import { View } from 'react-native';

import { CategoryTag } from '@/components/category-tag';
import { ListItem } from '@/components/ui/list-item';
import { Text } from '@/components/ui/text';

import { ParsedIngredient } from '../../api/types';

export type IngredientListPreviewProps = {
  ingredients: ParsedIngredient[];
  onRemove: (index: number) => void;
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
  if (ingredient.unit && ingredient.unit.trim()) {
    parts.push(ingredient.unit);
  }

  // Add name
  parts.push(ingredient.name);

  // Combine base parts
  let result = parts.join(' ');

  // Add notes in parentheses if present
  if (ingredient.notes && ingredient.notes.trim()) {
    result += ` (${ingredient.notes})`;
  }

  return result;
};

export const IngredientListPreview = ({
  ingredients,
  onRemove,
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
    <View className="gap-1">
      <Text className="mb-2 text-sm font-medium text-muted-foreground">
        Ingredients ({ingredients.length})
      </Text>
      {ingredients.map((ingredient, index) => (
        <ListItem
          key={`${ingredient.name}-${index}`}
          onDelete={() => onRemove(index)}
          className="rounded-lg bg-card"
        >
          <View className="flex-1 gap-1">
            <Text className="text-base text-foreground">
              {formatIngredient(ingredient)}
            </Text>
            {ingredient.category && (
              <View className="flex-row">
                <CategoryTag category={ingredient.category} />
              </View>
            )}
          </View>
        </ListItem>
      ))}
      <Text className="mt-2 text-center text-xs text-muted-foreground">
        Swipe left to remove an ingredient
      </Text>
    </View>
  );
};
