import { View } from 'react-native';

import { CategoryTag } from '@/components/category-tag';
import {
  formatQuantityUnit,
  normalizeUnit,
} from '@/components/item-sheet/unit-utils';
import { DEFAULT_UNIT_VALUE } from '@/components/item-sheet/units';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { HapticPressable } from '@/components/ui/haptic-pressable';
import { ListItem } from '@/components/ui/list-item';
import { Text } from '@/components/ui/text';

import { cn } from '../../../../lib/utils';
import { ParsedIngredient } from '../../api/types';

export type IngredientListPreviewProps = {
  ingredients: ParsedIngredient[];
  selectedIndices: Set<number>;
  onToggleSelection: (index: number) => void;
  onToggleAll: () => void;
  onEdit?: (index: number, ingredient: ParsedIngredient) => void;
  showHeader?: boolean;
};

export type IngredientListHeaderProps = {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleAll: () => void;
  isEditable: boolean;
};

const getIngredientQuantityDisplay = (
  ingredient: ParsedIngredient
): string | null => {
  const normalizedUnit = normalizeUnit(ingredient.unit);
  if (ingredient.quantity != null) {
    return formatQuantityUnit(ingredient.quantity, normalizedUnit);
  }

  if (normalizedUnit && normalizedUnit !== DEFAULT_UNIT_VALUE) {
    return normalizedUnit;
  }

  return null;
};

export const IngredientListHeader = ({
  selectedCount,
  totalCount,
  allSelected,
  onToggleAll,
  isEditable,
}: IngredientListHeaderProps) => {
  return (
    <View className="flex-row items-center justify-between">
      <View>
        <Text className="text-xl font-semibold text-foreground">
          Ingredients ({selectedCount}/{totalCount})
        </Text>
        <Text className="text-xs text-muted-foreground">
          {isEditable && 'Tap an item to edit'}
        </Text>
      </View>
      <Button variant="secondary" onPress={onToggleAll}>
        <Text className="text-sm">
          {allSelected ? 'Deselect all' : 'Select all'}
        </Text>
      </Button>
    </View>
  );
};

export const IngredientListPreview = ({
  ingredients,
  selectedIndices,
  onToggleSelection,
  onToggleAll,
  onEdit,
  showHeader = true,
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
      {showHeader ? (
        <IngredientListHeader
          selectedCount={selectedIndices.size}
          totalCount={ingredients.length}
          allSelected={allSelected}
          onToggleAll={onToggleAll}
          isEditable={!!onEdit}
        />
      ) : null}
      {ingredients.map((ingredient, index) => {
        const isSelected = selectedIndices.has(index);
        const quantityDisplay = getIngredientQuantityDisplay(ingredient);
        return (
          <ListItem
            key={`${ingredient.name}-${index}`}
            className={cn(
              'gap-2 py-2',
              index !== ingredients.length - 1 &&
                'border-b border-dashed border-border'
            )}
          >
            <Checkbox
              checked={isSelected}
              onPress={() => onToggleSelection(index)}
              className="mr-2"
            />
            <HapticPressable
              className="flex-1 gap-1"
              onPress={() => onEdit?.(index, ingredient)}
              disabled={!onEdit}
              accessibilityLabel={`Edit ingredient: ${ingredient.name}`}
              accessibilityRole="button"
              hapticType="light"
            >
              <View className="flex-row items-start justify-between">
                <View className="min-w-0 flex-1 pr-2">
                  <Text
                    className={cn(
                      'text-xl font-medium text-foreground',
                      !isSelected && 'text-muted-foreground'
                    )}
                  >
                    {ingredient.name}
                  </Text>
                </View>
                {quantityDisplay ? (
                  <Text className="shrink-0 text-lg text-muted-foreground">
                    {quantityDisplay}
                  </Text>
                ) : null}
              </View>
              {ingredient.notes ? (
                <Text className="text-sm text-muted-foreground">
                  {ingredient.notes}
                </Text>
              ) : null}
              <View className="min-h-6 flex-row items-center gap-2 pb-1.5">
                {ingredient.category ? (
                  <CategoryTag category={ingredient.category} />
                ) : null}
              </View>
            </HapticPressable>
          </ListItem>
        );
      })}
    </View>
  );
};
