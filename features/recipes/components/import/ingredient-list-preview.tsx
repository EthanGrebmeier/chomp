import { Platform, View } from 'react-native';

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
import { useCategoryOptions } from '@/features/categories/use-category-options';

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
    return normalizedUnit.replace(/ /g, '\u00A0');
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
        <Text variant="h4" tabularNumbers>
          Ingredients ({selectedCount}/{totalCount})
        </Text>
      </View>
      <Button variant="outline" onPress={onToggleAll}>
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
  const { data: categoryOptions } = useCategoryOptions();
  const compactTextStyle = Platform.select({
    android: { includeFontPadding: false },
    default: undefined,
  });

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
        const notes = ingredient.notes?.trim();

        return (
          <ListItem
            key={`${ingredient.name}-${index}`}
            className={cn(
              index !== ingredients.length - 1 &&
                'border-b border-dashed border-border'
            )}
          >
            <Checkbox
              checked={isSelected}
              onPress={() => onToggleSelection(index)}
              className="mr-1"
            />
            <HapticPressable
              className="flex-1 gap-1 py-1"
              onPress={() => onEdit?.(index, ingredient)}
              disabled={!onEdit}
              accessibilityLabel={`Edit ingredient: ${ingredient.name}`}
              accessibilityRole="button"
              hapticType="light"
            >
              <View className="flex-row justify-between">
                <View className="relative flex-1 flex-row gap-2 pr-2">
                  <View className="flex-row items-center gap-2">
                    <Text
                      variant="itemTitle"
                      className={cn(!isSelected && 'text-muted-foreground')}
                      style={compactTextStyle}
                    >
                      {ingredient.name}
                      {quantityDisplay ? (
                        <>
                          {'  '}
                          <Text
                            variant="itemMeta"
                            className="pl-2"
                            style={compactTextStyle}
                          >
                            {quantityDisplay}
                          </Text>
                        </>
                      ) : null}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  {ingredient.category ? (
                    <CategoryTag
                      category={ingredient.category}
                      categoryOptions={categoryOptions}
                    />
                  ) : null}
                </View>
              </View>
              {notes ? (
                <Text variant="itemDescription" style={compactTextStyle}>
                  {notes}
                </Text>
              ) : null}
            </HapticPressable>
          </ListItem>
        );
      })}
    </View>
  );
};
