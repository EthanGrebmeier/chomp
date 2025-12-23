import { useRouter } from 'expo-router';
import { CheckIcon, ExternalLinkIcon } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { toast } from 'sonner-native';

import { addRecipeToList } from '../../../features/recipes/instant/add-recipe-to-list';
import {
  RecipeIngredient,
  RecipeWithIngredients,
} from '../../../features/recipes/types';
import { cn } from '../../../lib/utils';
import { BottomSheet } from '../../bottom-sheet';
import { BackButton } from '../../ui/back-button';
import { Button } from '../../ui/button';
import { HapticPressable } from '../../ui/haptic-pressable';
import { Icon } from '../../ui/icon';
import { Text } from '../../ui/text';

type IngredientRowProps = {
  className?: string;
  ingredient: RecipeIngredient;
  isSelected: boolean;
  onToggle: () => void;
};

const IngredientRow = ({
  className,
  ingredient,
  isSelected,
  onToggle,
}: IngredientRowProps) => {
  const formatQuantity = () => {
    if (ingredient.unit === 'each') {
      return `x${ingredient.quantity}`;
    }
    return `${ingredient.quantity} ${ingredient.unit}`;
  };

  return (
    <HapticPressable
      onPress={onToggle}
      hapticType="selection"
      className={cn('flex-row items-center gap-3 py-3', className)}
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
      <View className="flex-1">
        <Text
          className={cn(
            'text-base font-medium',
            isSelected ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {ingredient.name}
        </Text>
        {ingredient.notes && (
          <Text className="text-sm text-muted-foreground">
            {ingredient.notes}
          </Text>
        )}
      </View>
      <Text className="text-sm text-muted-foreground">{formatQuantity()}</Text>
    </HapticPressable>
  );
};

type IngredientSelectorProps = {
  recipe: RecipeWithIngredients;
  listId: string;
  onBack: () => void;
  onComplete: () => void;
  onDismiss: () => void;
};

export const IngredientSelector = ({
  recipe,
  listId,
  onBack,
  onComplete,
  onDismiss,
}: IngredientSelectorProps) => {
  const router = useRouter();
  // Initialize with all ingredients selected
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(recipe.recipe_ingredients.map(i => i.id))
  );
  const [isAdding, setIsAdding] = useState(false);

  const toggleIngredient = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === recipe.recipe_ingredients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(recipe.recipe_ingredients.map(i => i.id)));
    }
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0) return;

    setIsAdding(true);
    try {
      const selectedIngredients = recipe.recipe_ingredients
        .filter(i => selectedIds.has(i.id))
        .map(i => ({
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          notes: i.notes ?? null,
          category: i.category ?? null,
          storeId: i.store?.id,
        }));

      await addRecipeToList({
        recipeId: recipe.id,
        listId,
        ingredients: selectedIngredients,
      });

      toast.success(
        `Added ${selectedIngredients.length} item${selectedIngredients.length === 1 ? '' : 's'} from ${recipe.name}`
      );
      onComplete();
    } catch {
      toast.error('Failed to add ingredients');
    } finally {
      setIsAdding(false);
    }
  };

  const allSelected = selectedIds.size === recipe.recipe_ingredients.length;

  const handleGoToRecipe = () => {
    onDismiss();
    router.push(`/recipes/${recipe.id}`);
  };

  return (
    <View>
      <View className="mb-3 w-full flex-row items-center gap-2">
        <BackButton onPress={onBack} />
        <BottomSheet.Header
          title={recipe.name}
          button={
            <Button
              variant="secondary"
              onPress={handleGoToRecipe}
              size="circle"
            >
              <Icon
                as={ExternalLinkIcon}
                size={20}
                className="text-muted-foreground"
              />
            </Button>
          }
        />
      </View>

      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-lg font-medium text-foreground">
            Ingredients
          </Text>
          <Text className="text-sm text-muted-foreground">
            {selectedIds.size} of {recipe.recipe_ingredients.length} selected
          </Text>
        </View>
        <Button variant="secondary" onPress={toggleAll}>
          <Text className="text-sm ">
            {allSelected ? 'Deselect all' : 'Select all'}
          </Text>
        </Button>
      </View>

      <ScrollView
        className="max-h-64 min-h-24"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {recipe.recipe_ingredients.map((ingredient, index) => (
          <IngredientRow
            className={cn(
              index < recipe.recipe_ingredients.length - 1 &&
                'border-b border-border'
            )}
            key={ingredient.id}
            ingredient={ingredient}
            isSelected={selectedIds.has(ingredient.id)}
            onToggle={() => toggleIngredient(ingredient.id)}
          />
        ))}
      </ScrollView>

      <View className="mt-4 flex-row items-center justify-end">
        <Button
          onPress={handleAdd}
          disabled={selectedIds.size === 0 || isAdding}
        >
          <Text>Add to List</Text>
        </Button>
      </View>
    </View>
  );
};
