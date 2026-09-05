import { PencilLineIcon } from 'lucide-react-native';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { toast } from 'sonner-native';

import { CategoryTag } from '../../../components/category-tag';
import { useCategoryOptions } from '../../../features/categories/use-category-options';
import {
  RecipeConflictSheet,
  RecipeConflictSheetRef,
} from '../../../features/grocery-list/components/recipe-conflict-sheet';
import {
  RecipeDetailSheet,
  RecipeDetailSheetRef,
} from '../../../features/recipes/components/recipe-detail-sheet';
import { addRecipeToList } from '../../../features/recipes/instant/add-recipe-to-list';
import {
  RecipeIngredient,
  RecipeWithIngredients,
} from '../../../features/recipes/types';
import { CategoryOption } from '../../../features/shared/category/categories';
import { useDefaultStore } from '../../../features/stores/instant/use-default-store';
import { cn } from '../../../lib/utils';
import { BottomSheet } from '../../bottom-sheet';
import { BackButton } from '../../ui/back-button';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { ExternalLinkButton } from '../../ui/external-link-button';
import { HapticPressable } from '../../ui/haptic-pressable';
import { Icon } from '../../ui/icon';
import { ListItem } from '../../ui/list-item';
import { Text } from '../../ui/text';
import { formatQuantityUnit } from '../unit-utils';

type IngredientRowProps = {
  className?: string;
  ingredient: RecipeIngredient;
  categoryOptions: CategoryOption[];
  isSelected: boolean;
  onToggle: () => void;
  onEdit?: () => void;
};

const IngredientRow = ({
  className,
  ingredient,
  categoryOptions,
  isSelected,
  onToggle,
  onEdit,
}: IngredientRowProps) => {
  const compactTextStyle = Platform.select({
    android: { includeFontPadding: false },
    default: undefined,
  });

  return (
    <ListItem className={cn('py-1', className)}>
      <Checkbox checked={isSelected} onPress={onToggle} className="mr-1" />
      <HapticPressable
        onPress={onToggle}
        hapticType="selection"
        className="flex-1 gap-1 py-1"
      >
        <View className="flex-row justify-between">
          <View className="relative flex-1 flex-row gap-2 pr-2">
            <Text
              variant="itemTitle"
              className={cn(!isSelected && 'text-muted-foreground')}
              style={compactTextStyle}
            >
              {ingredient.name}
              {'  '}
              <Text
                variant="itemMeta"
                className={cn(!isSelected && 'opacity-80')}
                style={compactTextStyle}
              >
                {formatQuantityUnit(ingredient.quantity, ingredient.unit)}
              </Text>
            </Text>
          </View>
          {ingredient.category ? (
            <CategoryTag
              category={ingredient.category}
              categoryOptions={categoryOptions}
            />
          ) : null}
        </View>
        {ingredient.notes ? (
          <Text
            variant="itemDescription"
            className={cn(!isSelected && 'opacity-80')}
            style={compactTextStyle}
          >
            {ingredient.notes}
          </Text>
        ) : null}
      </HapticPressable>
      {onEdit ? (
        <HapticPressable
          onPress={onEdit}
          hapticType="selection"
          className="rounded-md p-2"
        >
          <Icon
            as={PencilLineIcon}
            size={16}
            className="text-muted-foreground"
          />
        </HapticPressable>
      ) : null}
    </ListItem>
  );
};

type MealPlanSelectableIngredient = RecipeIngredient & {
  sourceRecipeIngredientId?: string;
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
  mode?: 'add-to-list' | 'meal-plan';
  mealPlanIngredients?: MealPlanSelectableIngredient[];
  onPersistSelection?: (selectedIds: Set<string>) => void;
  onEditIngredient?: (id: string) => void;
  showHeader?: boolean;
  bottomContentInset?: number;
};

export type IngredientSelectorRef = {
  submit: () => void;
  openRecipeDetails: () => void;
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
    mode = 'add-to-list',
    mealPlanIngredients,
    onPersistSelection,
    onEditIngredient,
    showHeader = true,
    bottomContentInset,
  }: IngredientSelectorProps,
  ref
) {
  const recipeDetailSheetRef = useRef<RecipeDetailSheetRef>(null);
  const ingredients = useMemo<MealPlanSelectableIngredient[]>(
    () =>
      mealPlanIngredients ??
      recipe.recipe_ingredients.map(ingredient => ({
        ...ingredient,
        sourceRecipeIngredientId: ingredient.id,
      })),
    [mealPlanIngredients, recipe.recipe_ingredients]
  );
  const ingredientIds = useMemo(
    () =>
      ingredients.map(
        ingredient => ingredient.sourceRecipeIngredientId ?? ingredient.id
      ),
    [ingredients]
  );
  const isControlled = Boolean(
    selectedIds && onToggleIngredient && onToggleAll
  );
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(
    new Set(ingredientIds)
  );
  const [isAddingInternal, setIsAddingInternal] = useState(false);
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);
  const [pendingConflictIngredients, setPendingConflictIngredients] = useState<
    SelectedIngredientInput[] | null
  >(null);
  const conflictSheetRef = useRef<RecipeConflictSheetRef>(null);
  const { data: categoryOptions } = useCategoryOptions();
  const { data: defaultStore } = useDefaultStore();

  useEffect(() => {
    if (isControlled) return;

    const frame = requestAnimationFrame(() => {
      setInternalSelectedIds(new Set(ingredientIds));
    });
    return () => cancelAnimationFrame(frame);
  }, [ingredientIds, isControlled]);

  const effectiveSelectedIds = isControlled
    ? (selectedIds as Set<string>)
    : internalSelectedIds;

  const allSelected = effectiveSelectedIds.size === ingredients.length;

  const handleGoToRecipe = useCallback(() => {
    recipeDetailSheetRef.current?.present(recipe.id);
  }, [recipe.id]);

  const handleToggleIngredient = (id: string) => {
    if (isControlled) {
      const nextSelected = new Set(effectiveSelectedIds);
      if (nextSelected.has(id)) {
        nextSelected.delete(id);
      } else {
        nextSelected.add(id);
      }
      onToggleIngredient?.(id);
      onPersistSelection?.(nextSelected);
      return;
    }
    setInternalSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      onPersistSelection?.(next);
      return next;
    });
  };

  const handleToggleAll = () => {
    if (isControlled) {
      const shouldSelectAll = effectiveSelectedIds.size !== ingredients.length;
      const nextSelected = shouldSelectAll
        ? new Set(ingredientIds)
        : new Set<string>();
      onToggleAll?.();
      onPersistSelection?.(nextSelected);
      return;
    }
    setInternalSelectedIds(prev => {
      const allSelectedInternal = prev.size === ingredients.length;
      if (allSelectedInternal) {
        const cleared = new Set<string>();
        onPersistSelection?.(cleared);
        return cleared;
      }
      const allIds = new Set(ingredientIds);
      onPersistSelection?.(allIds);
      return allIds;
    });
  };

  const buildSelectedIngredients = useCallback(
    (): SelectedIngredientInput[] =>
      ingredients
        .filter(ingredient =>
          effectiveSelectedIds.has(
            ingredient.sourceRecipeIngredientId ?? ingredient.id
          )
        )
        .map(ingredient => ({
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          notes: ingredient.notes ?? null,
          category: ingredient.category ?? null,
          storeName: ingredient.store?.name ?? null,
          storeId: ingredient.store?.id,
        })),
    [effectiveSelectedIds, ingredients]
  );

  const resolveConflict = async (resolution: 'increment' | 'separate') => {
    if (!listId || !pendingConflictIngredients?.length) return;

    setIsResolvingConflict(true);
    try {
      const result = await addRecipeToList({
        recipeId: recipe.id,
        listId,
        ingredients: pendingConflictIngredients,
        defaultStore,
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
        defaultStore,
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
    defaultStore,
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
  const resolvedBottomInset =
    bottomContentInset ?? (shouldShowFooter ? 88 : 16);

  useEffect(() => {
    onBusyStateChange?.(isAddingResolved);
  }, [isAddingResolved, onBusyStateChange]);

  useImperativeHandle(
    ref,
    () => ({
      submit: () => {
        void handleAdd();
      },
      openRecipeDetails: handleGoToRecipe,
    }),
    [handleAdd, handleGoToRecipe]
  );

  return (
    <>
      <View className="relative flex-1">
        {showHeader ? (
          <BottomSheet.Header
            className="px-4"
            title="Choose ingredients"
            description={recipe.name}
            dismissButton={<BackButton onPress={onBack} />}
            button={
              mode === 'add-to-list' ? (
                <ExternalLinkButton onPress={handleGoToRecipe} />
              ) : undefined
            }
          />
        ) : null}

        <View
          className={cn(
            'flex-row items-center justify-between px-4',
            !showHeader && 'pt-4'
          )}
        >
          <View>
            <Text className="text-lg font-medium text-foreground">
              Ingredients
            </Text>
            <Text variant="caption" tabularNumbers>
              {effectiveSelectedIds.size} of {ingredients.length} selected
            </Text>
          </View>
          <Button variant="outline" onPress={handleToggleAll}>
            <Text className="text-sm ">
              {allSelected ? 'Deselect all' : 'Select all'}
            </Text>
          </Button>
        </View>

        <ScrollView
          className="min-h-24 flex-1"
          contentContainerStyle={{ paddingBottom: resolvedBottomInset }}
          contentInset={{ bottom: resolvedBottomInset }}
          scrollIndicatorInsets={{ bottom: resolvedBottomInset }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {ingredients.map((ingredient, index) => {
            const ingredientId =
              ingredient.sourceRecipeIngredientId ?? ingredient.id;
            return (
              <IngredientRow
                className={cn(
                  index < ingredients.length - 1 &&
                    'border-b border-dashed border-border'
                )}
                key={ingredient.id}
                ingredient={ingredient}
                categoryOptions={categoryOptions}
                isSelected={effectiveSelectedIds.has(ingredientId)}
                onToggle={() => handleToggleIngredient(ingredientId)}
                onEdit={
                  onEditIngredient
                    ? () => onEditIngredient(ingredientId)
                    : undefined
                }
              />
            );
          })}
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
      <RecipeDetailSheet ref={recipeDetailSheetRef} listId={listId} />
    </>
  );
});
