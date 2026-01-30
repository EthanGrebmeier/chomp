import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CheckIcon, ExternalLinkIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
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
import { formatQuantityUnit } from '../unit-utils';

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
      </View>
      <Text className="text-sm text-muted-foreground">
        {formatQuantityUnit(ingredient.quantity, ingredient.unit)}
      </Text>
    </HapticPressable>
  );
};

type IngredientSelectorProps = {
  recipe: RecipeWithIngredients;
  onBack: () => void;
  onDismiss: () => void;
  showFooter?: boolean;
  listId?: string;
  onComplete?: () => void;
  selectedIds?: Set<string>;
  onToggleIngredient?: (id: string) => void;
  onToggleAll?: () => void;
  onAddToList?: () => void;
  isAdding?: boolean;
};

export const IngredientSelector = ({
  recipe,
  onBack,
  onDismiss,
  selectedIds,
  onToggleIngredient,
  onToggleAll,
  showFooter,
  listId,
  onComplete,
  onAddToList,
  isAdding,
}: IngredientSelectorProps) => {
  const router = useRouter();
  const isControlled = Boolean(
    selectedIds && onToggleIngredient && onToggleAll
  );
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(
    new Set(recipe.recipe_ingredients.map(ingredient => ingredient.id))
  );
  const [isAddingInternal, setIsAddingInternal] = useState(false);

  useEffect(() => {
    if (!isControlled) {
      setInternalSelectedIds(
        new Set(recipe.recipe_ingredients.map(ingredient => ingredient.id))
      );
    }
  }, [isControlled, recipe.recipe_ingredients]);

  const effectiveSelectedIds = isControlled
    ? (selectedIds as Set<string>)
    : internalSelectedIds;

  const allSelected =
    effectiveSelectedIds.size === recipe.recipe_ingredients.length;

  const handleGoToRecipe = () => {
    onDismiss();
    router.push(`/recipes/${recipe.id}`);
  };

  const handleToggleIngredient = (id: string) => {
    if (isControlled) {
      onToggleIngredient?.(id);
      return;
    }
    setInternalSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (isControlled) {
      onToggleAll?.();
      return;
    }
    setInternalSelectedIds(prev => {
      const allSelectedInternal =
        prev.size === recipe.recipe_ingredients.length;
      if (allSelectedInternal) {
        return new Set();
      }
      return new Set(
        recipe.recipe_ingredients.map(ingredient => ingredient.id)
      );
    });
  };

  const handleAdd = async () => {
    if (onAddToList) {
      onAddToList();
      return;
    }
    if (!listId || effectiveSelectedIds.size === 0) return;

    setIsAddingInternal(true);
    try {
      const selectedIngredients = recipe.recipe_ingredients
        .filter(ingredient => effectiveSelectedIds.has(ingredient.id))
        .map(ingredient => ({
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          notes: ingredient.notes ?? null,
          category: ingredient.category ?? null,
          storeId: ingredient.store?.id,
        }));

      await addRecipeToList({
        recipeId: recipe.id,
        listId,
        ingredients: selectedIngredients,
      });

      toast.success(
        `Added ${selectedIngredients.length} item${selectedIngredients.length === 1 ? '' : 's'} from ${recipe.name}`
      );
      onComplete?.();
    } catch {
      toast.error('Failed to add ingredients');
    } finally {
      setIsAddingInternal(false);
    }
  };

  const shouldShowFooter = showFooter ?? Boolean(onAddToList ?? listId);
  const isAddingResolved = isAdding ?? isAddingInternal;

  return (
    <View className="relative">
      <BottomSheet.Header
        className="px-4"
        title={recipe.name}
        dismissButton={<BackButton onPress={onBack} />}
        button={
          <Button variant="secondary" onPress={handleGoToRecipe} size="circle">
            <Icon
              as={ExternalLinkIcon}
              size={20}
              className="text-secondary-foreground"
            />
          </Button>
        }
      />

      <View className="flex-row items-center justify-between px-4">
        <View>
          <Text className="text-lg font-medium text-foreground">
            Ingredients
          </Text>
          <Text className="text-sm text-muted-foreground">
            {effectiveSelectedIds.size} of {recipe.recipe_ingredients.length}{' '}
            selected
          </Text>
        </View>
        <Button variant="secondary" onPress={handleToggleAll}>
          <Text className="text-sm ">
            {allSelected ? 'Deselect all' : 'Select all'}
          </Text>
        </Button>
      </View>

      <ScrollView
        className="max-h-64 min-h-24"
        contentContainerClassName="px-4 pb-20"
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
            isSelected={effectiveSelectedIds.has(ingredient.id)}
            onToggle={() => handleToggleIngredient(ingredient.id)}
          />
        ))}
      </ScrollView>

      <LinearGradient
        colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0)']}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        pointerEvents="none"
        style={styles.footerGradient}
      />
      {shouldShowFooter && (
        <View className="relative mt-4 px-4 pb-4">
          <Button
            onPress={handleAdd}
            disabled={effectiveSelectedIds.size === 0 || isAddingResolved}
          >
            <Text>Add to List</Text>
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  footerGradient: {
    position: 'absolute',
    bottom: -40,
    left: 0,
    right: 0,
    height: 120,
  },
});
