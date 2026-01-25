import { CheckIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { CategoryTag } from '@/components/category-tag';
import { Button } from '@/components/ui/button';
import { HapticPressable } from '@/components/ui/haptic-pressable';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

import { cn } from '../../../../lib/utils';
import { ParsedIngredient } from '../../api/types';

export type IngredientListPreviewProps = {
  ingredients: ParsedIngredient[];
  selectedIndices: Set<number>;
  onToggleSelection: (index: number) => void;
  onToggleAll: () => void;
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
  selectedIndices,
  onToggleSelection,
  onToggleAll,
  onEdit,
}: IngredientListPreviewProps) => {
  if (ingredients.length === 0) {
    return (
      <View className="items-center justify-center py-8">
        <Text className="text-base text-muted-foreground">
          No ingredients found
        </Text>
      </View>
    );
  }

  const allSelected = selectedIndices.size === ingredients.length;

  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-semibold text-foreground">
            Ingredients ({selectedIndices.size}/{ingredients.length})
          </Text>
          <Text className="text-xs text-muted-foreground">
            {onEdit ? 'Tap checkbox to select, tap text to edit' : 'Tap to select'}
          </Text>
        </View>
        <Button variant="secondary" onPress={onToggleAll}>
          <Text className="text-sm">
            {allSelected ? 'Deselect all' : 'Select all'}
          </Text>
        </Button>
      </View>
      {ingredients.map((ingredient, index) => {
        const isSelected = selectedIndices.has(index);
        return (
          <View
            key={`${ingredient.name}-${index}`}
            className={cn(
              'flex-row items-center gap-3 border-b border-dashed border-border py-3',
              index === ingredients.length - 1 && 'border-b-0'
            )}
          >
            <HapticPressable
              onPress={() => onToggleSelection(index)}
              hapticType="selection"
              accessibilityLabel={`${isSelected ? 'Deselect' : 'Select'} ingredient: ${ingredient.name}`}
              accessibilityRole="checkbox"
            >
              <View
                className={cn(
                  'size-8 items-center justify-center rounded-full',
                  isSelected ? 'bg-primary' : 'border-2 border-muted-foreground'
                )}
              >
                {isSelected && (
                  <Icon as={CheckIcon} size={18} className="text-primary-foreground" />
                )}
              </View>
            </HapticPressable>
            <Pressable
              className="flex-1 gap-1"
              onPress={() => onEdit?.(index, ingredient)}
              disabled={!onEdit}
              accessibilityLabel={`Edit ingredient: ${ingredient.name}`}
              accessibilityRole="button"
              style={({ pressed }) => ({
                opacity: pressed && onEdit ? 0.7 : 1,
              })}
            >
              <Text
                className={cn(
                  'text-base leading-[18px]',
                  isSelected ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
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
          </View>
        );
      })}
    </View>
  );
};
