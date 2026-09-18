import { View } from 'react-native';

import {
  formatQuantityUnit,
  normalizeUnit,
} from '@/components/item-sheet/unit-utils';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

import { ParsedIngredient } from '../../api/types';

type IngredientSummaryProps = {
  ingredients: ParsedIngredient[];
  selectedIndices: Set<number>;
  onEdit: () => void;
};

const formatCompactQuantity = (ingredient: ParsedIngredient) => {
  if (ingredient.quantity == null) return null;
  return formatQuantityUnit(
    ingredient.quantity,
    normalizeUnit(ingredient.unit)
  );
};

/**
 * Compact, read-only overview of the parsed ingredients shown by default on
 * the preview screen. Most imports are accepted as-is, so the full
 * checkbox/edit list is one tap away rather than the default.
 */
export const IngredientSummary = ({
  ingredients,
  selectedIndices,
  onEdit,
}: IngredientSummaryProps) => {
  const selected = selectedIndices.size;

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-sm font-medium text-muted-foreground">
            Ingredients {selected > 0 ? `(${selected})` : ''}
          </Text>
        </View>
        <Button variant="ghost" size="sm" onPress={onEdit}>
          <Text className="text-sm">Edit</Text>
        </Button>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {ingredients.map((ingredient, index) => {
          const isSelected = selectedIndices.has(index);
          const quantity = formatCompactQuantity(ingredient);
          return (
            <View
              key={`${ingredient.name}-${index}`}
              className={cn(
                'flex-row items-baseline gap-1.5 rounded-xl border px-3 py-1.5',
                isSelected
                  ? 'border-border bg-card'
                  : 'border-dashed border-border/60 bg-transparent'
              )}
            >
              <Text
                className={cn(
                  'text-sm',
                  isSelected
                    ? 'text-foreground'
                    : 'text-muted-foreground line-through'
                )}
              >
                {ingredient.name}
              </Text>
              {quantity ? (
                <Text
                  tabularNumbers
                  className={cn(
                    'text-xs',
                    isSelected
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground/60'
                  )}
                >
                  {quantity}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
};
