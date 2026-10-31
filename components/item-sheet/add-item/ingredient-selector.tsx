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

import { BottomActionButton } from '@/components/ui/bottom-action-button';
import type { StoreReviewer } from '@/features/quantity/app/store-review';
import { useStoreConflictPreview } from '@/features/quantity/app/use-store-conflict-preview';
import { isStoreReviewCancelled } from '@/features/quantity/store-review-cancelled';

import { CategoryTag } from '../../../components/category-tag';
import { useCategoryOptions } from '../../../features/categories/use-category-options';
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
import { SheetContent } from '../../sheet-content';
import { BackButton } from '../../ui/back-button';
import { Checkbox } from '../../ui/checkbox';
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
    <ListItem className={cn('px-8 py-1', className)}>
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
  reviewConflicts?: StoreReviewer;
  recipe: RecipeWithIngredients;
  onBack: () => void;
  onDismiss: () => void;
  onOpenRecipe?: () => void;
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
  selectionHeader?: 'default' | 'compact';
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
    reviewConflicts,
    onBack,
    onDismiss,
    onOpenRecipe,
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
    selectionHeader = 'default',
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
    if (onOpenRecipe) {
      onOpenRecipe();
      return;
    }
    recipeDetailSheetRef.current?.present(recipe.id);
  }, [onOpenRecipe, recipe.id]);

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
        reviewConflicts,
      });

      toast.success(
        `Added ${result.addedItems} item${result.addedItems === 1 ? '' : 's'} from ${recipe.name}`
      );
      onComplete?.();
    } catch (error) {
      if (isStoreReviewCancelled(error)) return;
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
    reviewConflicts,
  ]);

  const shouldShowFooter = showFooter ?? Boolean(onAddToList ?? listId);
  const conflictPreview = useStoreConflictPreview(
    mode === 'add-to-list' && shouldShowFooter ? listId : undefined,
    buildSelectedIngredients(),
    defaultStore?.id
  );

  const isAddingResolved = isAdding ?? isAddingInternal;
  // The footer is in normal flow, so the list needs only its trailing gutter.
  const resolvedBottomInset = bottomContentInset ?? 16;

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
          <>
            <BottomSheet.Header
              title="Choose ingredients"
              backAction={<BackButton onPress={onBack} />}
            />
          </>
        ) : null}

        {recipeNameHeading || showHeader ? (
          <SheetContent className="gap-2">
            <Text
              accessibilityRole="header"
              className="text-left text-2xl font-semibold leading-8"
            >
              {recipe.name}
            </Text>
            {showHeader && mode === 'add-to-list' ? (
              <HapticPressable
                accessibilityRole="button"
                onPress={handleGoToRecipe}
                className="min-h-11 justify-center self-start active:opacity-60"
              >
                <Text className="font-medium text-primary">View recipe</Text>
              </HapticPressable>
            ) : null}
            {scheduleControl}
          </SheetContent>
        ) : null}

        <View
          className={cn(
            'mb-2 flex-row items-center justify-between px-8',
            !showHeader &&
              !recipeNameHeading &&
              selectionHeader !== 'compact' &&
              'pt-4',
            (recipeNameHeading || showHeader) && 'pt-4'
          )}
        >
          <View className="min-w-0 flex-1 pr-3">
            <Text variant="overline">Ingredients</Text>
            {selectionHeader !== 'compact' ? (
              <Text variant="caption" tabularNumbers>
                {purchasedCount > 0
                  ? `${purchasedCount} purchased · ${unpurchasedSelectedCount} selected`
                  : `${effectiveSelectedIds.size} of ${ingredients.length} selected`}
              </Text>
            ) : null}
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
          <View className="px-8 pb-4 pt-3">
            <BottomActionButton
              onPress={() => {
                void handleAdd();
              }}
              disabled={effectiveSelectedIds.size === 0 || isAddingResolved}
            >
              <Text>
                {isAddingResolved
                  ? 'Adding...'
                  : conflictPreview.needsReview
                    ? conflictPreview.label
                    : 'Add to List'}
              </Text>
            </BottomActionButton>
          </View>
        )}
      </View>

      <RecipeDetailSheet ref={recipeDetailSheetRef} listId={listId} />
    </>
  );
});
