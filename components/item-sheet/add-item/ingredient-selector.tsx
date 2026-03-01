import { useRouter } from 'expo-router';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { ScrollView, View } from 'react-native';
import { toast } from 'sonner-native';

import { CategoryTag } from '../../../components/category-tag';
import {
  RecipeConflictSheet,
  RecipeConflictSheetRef,
} from '../../../features/grocery-list/components/recipe-conflict-sheet';
import { addRecipeToList } from '../../../features/recipes/instant/add-recipe-to-list';
import {
  RecipeIngredient,
  RecipeWithIngredients,
} from '../../../features/recipes/types';
import { cn } from '../../../lib/utils';
import { BottomSheet } from '../../bottom-sheet';
import { BackButton } from '../../ui/back-button';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { ExternalLinkButton } from '../../ui/external-link-button';
import { HapticPressable } from '../../ui/haptic-pressable';
import { ListItem } from '../../ui/list-item';
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
    <ListItem className={cn('gap-2 py-2', className)}>
      <Checkbox checked={isSelected} onPress={onToggle} className="mr-2" />
      <HapticPressable
        onPress={onToggle}
        hapticType="selection"
        className="flex-1 gap-1"
      >
        <View className="flex-row items-start justify-between">
          <View className="min-w-0 flex-1 pr-2">
            <Text
              className={cn(
                'text-xl font-medium leading-none text-foreground',
                !isSelected && 'text-muted-foreground'
              )}
            >
              {ingredient.name}
            </Text>
          </View>
          <Text className="shrink-0 text-lg leading-5 text-muted-foreground">
            {formatQuantityUnit(ingredient.quantity, ingredient.unit)}
          </Text>
        </View>
        {ingredient.notes ? (
          <Text className="text-sm leading-none text-muted-foreground">
            {ingredient.notes}
          </Text>
        ) : null}
        <View className="flex-row items-center gap-2">
          {ingredient.category ? (
            <CategoryTag category={ingredient.category} />
          ) : null}
        </View>
      </HapticPressable>
    </ListItem>
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
  onBusyStateChange?: (isBusy: boolean) => void;
};

export type IngredientSelectorRef = {
  submit: () => void;
};

type SelectedIngredientInput = {
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
  category?: string | null;
  storeName?: string | null;
  storeId?: string;
};

export const IngredientSelector = forwardRef<
  IngredientSelectorRef,
  IngredientSelectorProps
>(function IngredientSelector(
  {
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
    onBusyStateChange,
  }: IngredientSelectorProps,
  ref
) {
  const router = useRouter();
  const isControlled = Boolean(
    selectedIds && onToggleIngredient && onToggleAll
  );
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(
    new Set(recipe.recipe_ingredients.map(ingredient => ingredient.id))
  );
  const [isAddingInternal, setIsAddingInternal] = useState(false);
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);
  const [pendingConflictIngredients, setPendingConflictIngredients] = useState<
    SelectedIngredientInput[] | null
  >(null);
  const conflictSheetRef = useRef<RecipeConflictSheetRef>(null);

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

  const buildSelectedIngredients = useCallback(
    (): SelectedIngredientInput[] =>
      recipe.recipe_ingredients
        .filter(ingredient => effectiveSelectedIds.has(ingredient.id))
        .map(ingredient => ({
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          notes: ingredient.notes ?? null,
          category: ingredient.category ?? null,
          storeName: ingredient.store?.name ?? null,
          storeId: ingredient.store?.id,
        })),
    [effectiveSelectedIds, recipe.recipe_ingredients]
  );

  const resolveConflict = async (resolution: 'increment' | 'separate') => {
    if (!listId || !pendingConflictIngredients?.length) return;

    setIsResolvingConflict(true);
    try {
      const result = await addRecipeToList({
        recipeId: recipe.id,
        listId,
        ingredients: pendingConflictIngredients,
        conflictResolution: resolution,
      });

      toast.success(
        `Added ${result.addedItems} item${result.addedItems === 1 ? '' : 's'} from ${recipe.name}`
      );
      conflictSheetRef.current?.dismiss();
      setPendingConflictIngredients(null);
      onComplete?.();
    } catch {
      toast.error('Failed to resolve ingredient conflicts');
    } finally {
      setIsResolvingConflict(false);
    }
  };

  const handleAdd = useCallback(async () => {
    if (onAddToList) {
      onAddToList();
      return;
    }
    if (!listId || effectiveSelectedIds.size === 0) return;

    setIsAddingInternal(true);
    try {
      const selectedIngredients = buildSelectedIngredients();

      const result = await addRecipeToList({
        recipeId: recipe.id,
        listId,
        ingredients: selectedIngredients,
      });

      if (result.requiresConflictResolution) {
        setPendingConflictIngredients(selectedIngredients);
        conflictSheetRef.current?.present();
        return;
      }

      toast.success(
        `Added ${result.addedItems} item${result.addedItems === 1 ? '' : 's'} from ${recipe.name}`
      );
      onComplete?.();
    } catch {
      toast.error('Failed to add ingredients');
    } finally {
      setIsAddingInternal(false);
    }
  }, [
    buildSelectedIngredients,
    effectiveSelectedIds.size,
    listId,
    onAddToList,
    onComplete,
    recipe.id,
    recipe.name,
  ]);

  const shouldShowFooter = showFooter ?? Boolean(onAddToList ?? listId);
  const isAddingResolved =
    (isAdding ?? isAddingInternal) || isResolvingConflict;

  useEffect(() => {
    onBusyStateChange?.(isAddingResolved);
  }, [isAddingResolved, onBusyStateChange]);

  useImperativeHandle(
    ref,
    () => ({
      submit: () => {
        void handleAdd();
      },
    }),
    [handleAdd]
  );

  return (
    <>
      <View className="relative">
        <BottomSheet.Header
          className="px-4"
          title={recipe.name}
          dismissButton={<BackButton onPress={onBack} />}
          button={<ExternalLinkButton onPress={handleGoToRecipe} />}
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
          <Button variant="outline" onPress={handleToggleAll}>
            <Text className="text-sm ">
              {allSelected ? 'Deselect all' : 'Select all'}
            </Text>
          </Button>
        </View>

        <ScrollView
          className="max-h-[500px] min-h-24"
          contentContainerClassName="pb-12"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {recipe.recipe_ingredients.map((ingredient, index) => (
            <IngredientRow
              className={cn(
                index < recipe.recipe_ingredients.length - 1 &&
                  'border-b border-dashed border-border'
              )}
              key={ingredient.id}
              ingredient={ingredient}
              isSelected={effectiveSelectedIds.has(ingredient.id)}
              onToggle={() => handleToggleIngredient(ingredient.id)}
            />
          ))}
        </ScrollView>
        {shouldShowFooter && (
          <View className="px-4 pb-4 pt-3">
            <Button
              onPress={() => {
                void handleAdd();
              }}
              disabled={effectiveSelectedIds.size === 0 || isAddingResolved}
            >
              <Text>{isAddingResolved ? 'Adding...' : 'Add to List'}</Text>
            </Button>
          </View>
        )}
      </View>
      <RecipeConflictSheet
        ref={conflictSheetRef}
        recipeName={recipe.name}
        onIncrement={() => {
          void resolveConflict('increment');
        }}
        onCreateSeparate={() => {
          void resolveConflict('separate');
        }}
        onCancel={() => {
          conflictSheetRef.current?.dismiss();
          setPendingConflictIngredients(null);
        }}
        isPending={isResolvingConflict}
      />
    </>
  );
});
