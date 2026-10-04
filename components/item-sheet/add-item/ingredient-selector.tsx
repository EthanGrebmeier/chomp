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
import type { IngredientShoppingStatus } from '../../../features/meal-planner/utils/shopping-state';
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
  selectionDisabled?: boolean;
  shoppingStatus?: IngredientShoppingStatus;
};

const IngredientRow = ({
  className,
  ingredient,
  categoryOptions,
  isSelected,
  onToggle,
  onEdit,
  selectionDisabled = false,
  shoppingStatus,
}: IngredientRowProps) => {
  const compactTextStyle = Platform.select({
    android: { includeFontPadding: false },
    default: undefined,
  });

  return (
    <ListItem className={cn('py-1', className)}>
      {shoppingStatus === 'purchased' ? (
        <View className="mr-1 size-5" />
      ) : (
        <Checkbox
          checked={isSelected}
          onPress={onToggle}
          disabled={selectionDisabled}
          accessibilityLabel={`Include ${ingredient.name} on grocery list`}
          className="mr-1"
        />
      )}
      <HapticPressable
        onPress={onEdit ?? onToggle}
        disabled={!onEdit && selectionDisabled}
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
        {shoppingStatus === 'purchased' || shoppingStatus === 'removed' ? (
          <Text variant="itemDescription" className="text-muted-foreground">
            {shoppingStatus === 'purchased'
              ? 'Purchased'
              : 'Not on grocery list'}
          </Text>
        ) : null}
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
    </ListItem>
  );
};

type MealPlanSelectableIngredient = RecipeIngredient & {
  sourceRecipeIngredientId?: string;
  shoppingStatus?: IngredientShoppingStatus;
  selectionDisabled?: boolean;
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
  recipeNameHeading?: boolean;
  scheduleControl?: React.ReactNode;
  selectionDisabled?: boolean;
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
    recipeNameHeading = false,
    scheduleControl,
    selectionDisabled = false,
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

  const selectableIds = ingredients
    .filter(ingredient => !ingredient.selectionDisabled)
    .map(ingredient => ingredient.sourceRecipeIngredientId ?? ingredient.id);
  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every(id => effectiveSelectedIds.has(id));
  const bulkSelectionDisabled = selectionDisabled || selectableIds.length === 0;
  const purchasedCount = ingredients.filter(
    ingredient => ingredient.shoppingStatus === 'purchased'
  ).length;
  const unpurchasedSelectedCount = ingredients.filter(
    ingredient =>
      ingredient.shoppingStatus !== 'purchased' &&
      effectiveSelectedIds.has(
        ingredient.sourceRecipeIngredientId ?? ingredient.id
      )
  ).length;

  const handleGoToRecipe = useCallback(() => {
    recipeDetailSheetRef.current?.present(recipe.id);
  }, [recipe.id]);

  const handleToggleIngredient = (id: string) => {
    if (selectionDisabled || !selectableIds.includes(id)) return;
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
    if (bulkSelectionDisabled) return;
    if (isControlled) {
      const nextSelected = new Set(effectiveSelectedIds);
      for (const id of selectableIds) {
        if (allSelected) nextSelected.delete(id);
        else nextSelected.add(id);
      }
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

        {recipeNameHeading ? (
          <View className="gap-2 px-4 pt-4">
            <Text variant="h4" className="text-left">
              {recipe.name}
            </Text>
            {scheduleControl}
          </View>
        ) : null}

        <View
          className={cn(
            'mb-2 flex-row items-center justify-between px-4',
            !showHeader && !recipeNameHeading && 'pt-4',
            recipeNameHeading && 'pt-4'
          )}
        >
          <View>
            <Text variant="overline">
              Ingredients
            </Text>
            <Text variant="caption" tabularNumbers>
              {purchasedCount > 0
                ? `${purchasedCount} purchased · ${unpurchasedSelectedCount} selected`
                : `${effectiveSelectedIds.size} of ${ingredients.length} selected`}
            </Text>
          </View>
          <HapticPressable
            onPress={handleToggleAll}
            hapticType="selection"
            className="min-h-11 justify-center p-1"
            disabled={bulkSelectionDisabled}
            accessibilityRole="button"
            accessibilityState={{ disabled: bulkSelectionDisabled }}
          >
            <Text variant="caption" className="text-sm text-muted-foreground">
              {allSelected ? 'Deselect all' : 'Select all'}
            </Text>
          </HapticPressable>
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
                key={ingredient.id}
                ingredient={ingredient}
                categoryOptions={categoryOptions}
                isSelected={effectiveSelectedIds.has(ingredientId)}
                selectionDisabled={
                  selectionDisabled || ingredient.selectionDisabled
                }
                shoppingStatus={ingredient.shoppingStatus}
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
