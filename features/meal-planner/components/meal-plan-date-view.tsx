import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { IngredientSelector } from '../../../components/item-sheet/add-item/ingredient-selector';
import { EmptyHeading } from '../../../components/text/empty-heading';
import { EmptySubtext } from '../../../components/text/empty-subtext';
import { Button } from '../../../components/ui/button';
import { Pill } from '../../../components/ui/pill';
import { Text } from '../../../components/ui/text';
import { Recipe } from '../../recipes/types';
import { useAddMealsToGroceryList, useUnmarkMealAdded } from '../hooks';
import {
  applyMealPlanIngredientOverride,
  getSelectedSourceIngredientIds,
  hydrateMealPlanIngredientEditorFromSnapshot,
  MealPlanIngredientEditorRow,
  toggleAllMealPlanIngredientSelection,
  toggleMealPlanIngredientSelection,
} from '../meal-plan-recipe-ingredient-editor';
import { MealPlanIngredientSnapshotStore } from '../instant/meal-plan-ingredient-snapshot-store';
import {
  MealPlanItemWithStore,
  MealPlanRecipe,
  MealPlanRecipeWithRecipe,
  MealTag,
} from '../types';

import {
  MealPlanIngredientOverrideSheet,
  MealPlanIngredientOverrideSheetRef,
} from './meal-plan-ingredient-override-sheet';
import MealPlanItemCard from './meal-plan-item-card';
import MealPlanMealCard from './meal-plan-meal-card';

type MealPlanDateViewProps = {
  listId: string;
  recipes: MealPlanRecipeWithRecipe[];
  items: MealPlanItemWithStore[];
  onMealPress: ({
    mealPlanRecipe,
    recipe,
  }: {
    mealPlanRecipe: MealPlanRecipe;
    recipe: Recipe;
  }) => void;
  onItemPress: (item: MealPlanItemWithStore) => void;
};

const mealTimeOrder: MealTag[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Dessert',
  'None',
];

export const MealPlanDateView = ({
  listId,
  recipes,
  items,
  onMealPress,
  onItemPress,
}: MealPlanDateViewProps) => {
  const { mutate: addMealsToGroceryList, isPending: isAddingToList } =
    useAddMealsToGroceryList();
  const { mutate: unmarkMealAdded } = useUnmarkMealAdded();
  const quickReviewSheetRef = useRef<TrueSheet>(null);
  const ingredientOverrideSheetRef =
    useRef<MealPlanIngredientOverrideSheetRef>(null);
  const [quickReviewMealPlanRecipe, setQuickReviewMealPlanRecipe] =
    useState<MealPlanRecipeWithRecipe | null>(null);
  const queryClient = useQueryClient();

  const quickReviewRecipe = quickReviewMealPlanRecipe?.recipe ?? null;
  const quickReviewQueryKey = useMemo(
    () => ['meal-plan-quick-review-rows', quickReviewMealPlanRecipe?.id ?? null],
    [quickReviewMealPlanRecipe?.id]
  );

  const {
    data: quickReviewIngredientRows = [],
    isPending: isLoadingQuickReviewIngredients,
  } = useQuery<MealPlanIngredientEditorRow[]>({
    queryKey: quickReviewQueryKey,
    enabled: Boolean(quickReviewMealPlanRecipe && quickReviewRecipe),
    queryFn: async () => {
      if (!quickReviewMealPlanRecipe || !quickReviewRecipe) {
        return [];
      }
      const snapshotRows =
        await MealPlanIngredientSnapshotStore.ensureBackfilledSnapshot(
          quickReviewMealPlanRecipe.id
        );
      const reconciledRows = await MealPlanIngredientSnapshotStore.reconcileSnapshot(
        quickReviewMealPlanRecipe.id
      );

      return hydrateMealPlanIngredientEditorFromSnapshot({
        sourceIngredients: quickReviewRecipe.recipe_ingredients ?? [],
        snapshotRows: reconciledRows.length > 0 ? reconciledRows : snapshotRows,
      });
    },
  });

  const setQuickReviewQueryRows = useCallback(
    (
      updater: (
        rows: MealPlanIngredientEditorRow[]
      ) => MealPlanIngredientEditorRow[]
    ) => {
      queryClient.setQueryData<MealPlanIngredientEditorRow[]>(
        quickReviewQueryKey,
        prev => updater(prev ?? [])
      );
    },
    [queryClient, quickReviewQueryKey]
  );

  const quickReviewSelectionMutation = useMutation({
    mutationFn: ({
      snapshotRowId,
      isSelected,
    }: {
      snapshotRowId: string;
      isSelected: boolean;
    }) =>
      MealPlanIngredientSnapshotStore.updateRowSelection({
        snapshotRowId,
        isSelected,
      }),
  });

  const quickReviewOverrideMutation = useMutation({
    mutationFn: ({
      snapshotRowId,
      updates,
    }: {
      snapshotRowId: string;
      updates: {
        name: string;
        quantity: number;
        unit: string;
        notes?: string | null;
        category?: string | null;
        storeId?: string;
        isQuantityOverridden: boolean;
      };
    }) =>
      MealPlanIngredientSnapshotStore.updateRowOverrides({
        snapshotRowId,
        updates,
      }),
  });

  const selectedQuickReviewIngredientIds = useMemo(
    () => getSelectedSourceIngredientIds(quickReviewIngredientRows),
    [quickReviewIngredientRows]
  );

  const closeQuickReviewSheet = useCallback(() => {
    quickReviewSheetRef.current?.dismiss();
  }, []);

  const handleQuickReviewDismiss = useCallback(() => {
    setQuickReviewMealPlanRecipe(null);
    ingredientOverrideSheetRef.current?.dismiss();
  }, []);

  const handleOpenQuickReview = useCallback((mealPlanRecipe: MealPlanRecipeWithRecipe) => {
    setQuickReviewMealPlanRecipe(mealPlanRecipe);
    quickReviewSheetRef.current?.present();
  }, []);

  const handleToggleQuickReviewIngredientSelection = useCallback(
    async (sourceRecipeIngredientId: string) => {
      const currentRow = quickReviewIngredientRows.find(
        row => row.sourceRecipeIngredientId === sourceRecipeIngredientId
      );
      if (!currentRow?.snapshotRowId) return;

      const previousIsSelected = currentRow.isSelected;
      const nextIsSelected = !previousIsSelected;

      setQuickReviewQueryRows(rows =>
        toggleMealPlanIngredientSelection(rows, sourceRecipeIngredientId)
      );

      try {
        await quickReviewSelectionMutation.mutateAsync({
          snapshotRowId: currentRow.snapshotRowId,
          isSelected: nextIsSelected,
        });
      } catch {
        setQuickReviewQueryRows(rows =>
          rows.map(row =>
            row.sourceRecipeIngredientId === sourceRecipeIngredientId
              ? { ...row, isSelected: previousIsSelected }
              : row
          )
        );
        toast.error('Failed to save ingredient selection');
      }
    },
    [
      quickReviewIngredientRows,
      quickReviewSelectionMutation,
      setQuickReviewQueryRows,
    ]
  );

  const handleToggleAllQuickReviewIngredientSelections = useCallback(async () => {
    if (quickReviewIngredientRows.length === 0) return;

    const previousRows = quickReviewIngredientRows;
    const nextRows = toggleAllMealPlanIngredientSelection(previousRows);
    const nextIsSelected = nextRows[0]?.isSelected ?? true;

    setQuickReviewQueryRows(() => nextRows);
    try {
      await Promise.all(
        previousRows
          .filter(row => row.snapshotRowId)
          .map(row =>
            quickReviewSelectionMutation.mutateAsync({
              snapshotRowId: row.snapshotRowId as string,
              isSelected: nextIsSelected,
            })
          )
      );
    } catch {
      setQuickReviewQueryRows(() => previousRows);
      toast.error('Failed to save ingredient selections');
    }
  }, [
    quickReviewIngredientRows,
    quickReviewSelectionMutation,
    setQuickReviewQueryRows,
  ]);

  const handleEditQuickReviewIngredient = useCallback(
    (sourceRecipeIngredientId: string) => {
      const row = quickReviewIngredientRows.find(
        ingredientRow =>
          ingredientRow.sourceRecipeIngredientId === sourceRecipeIngredientId
      );
      if (!row) return;
      ingredientOverrideSheetRef.current?.present(row);
    },
    [quickReviewIngredientRows]
  );

  const handleConfirmQuickAdd = useCallback(() => {
    if (!quickReviewMealPlanRecipe || isAddingToList) return;

    addMealsToGroceryList(
      {
        listId,
        selectedRecipeIds: [quickReviewMealPlanRecipe.id],
      },
      {
        onSuccess: result => {
          const totalAdded = result.addedRecipes + result.addedItems;
          if (totalAdded === 0) {
            toast.info('Already added to list');
          } else {
            toast.success(`Added ${quickReviewMealPlanRecipe.recipe.name} to list`);
          }
          closeQuickReviewSheet();
        },
        onError: () => {
          toast.error('Failed to add to list');
        },
      }
    );
  }, [addMealsToGroceryList, closeQuickReviewSheet, isAddingToList, listId, quickReviewMealPlanRecipe]);

  const handleIndicatorPress = useCallback(
    (
      type: 'recipe' | 'item',
      id: string,
      name: string,
      addedToList: boolean
    ) => {
      if (isAddingToList) return;

      if (addedToList) {
        Alert.alert(
          'Already Added',
          `"${name}" has already been added to a grocery list. Would you like to mark it as unadded?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Mark as Unadded',
              onPress: () => unmarkMealAdded({ type, id }),
            },
          ]
        );
      } else {
        if (type === 'recipe') {
          const mealPlanRecipe = recipes.find(recipe => recipe.id === id);
          if (!mealPlanRecipe) {
            toast.error('Recipe not found');
            return;
          }
          handleOpenQuickReview(mealPlanRecipe);
          return;
        }

        const args = { listId, selectedItemIds: [id] };

        addMealsToGroceryList(args, {
          onSuccess: result => {
            const totalAdded = result.addedRecipes + result.addedItems;
            if (totalAdded === 0) {
              toast.info('Already added to list');
            } else {
              toast.success(`Added ${name} to list`);
            }
          },
          onError: () => {
            toast.error('Failed to add to list');
          },
        });
      }
    },
    [
      addMealsToGroceryList,
      handleOpenQuickReview,
      isAddingToList,
      listId,
      recipes,
      unmarkMealAdded,
    ]
  );

  const handleRecipeIndicatorPress = useCallback(
    (mealPlanRecipe: MealPlanRecipe) => {
      // Find the recipe name from the recipes prop
      const match = recipes.find(r => r.id === mealPlanRecipe.id);
      const name = match?.recipe?.name ?? 'Recipe';
      handleIndicatorPress(
        'recipe',
        mealPlanRecipe.id,
        name,
        !!mealPlanRecipe.addedToList
      );
    },
    [recipes, handleIndicatorPress]
  );

  const handleItemIndicatorPress = useCallback(
    (mealPlanItem: MealPlanItemWithStore) => {
      handleIndicatorPress(
        'item',
        mealPlanItem.id,
        mealPlanItem.name,
        !!mealPlanItem.addedToList
      );
    },
    [handleIndicatorPress]
  );

  // Group recipes by meal time
  const groupedRecipes = recipes.reduce(
    (acc, recipe) => {
      if (!recipe.recipe) return acc;
      const tag = (recipe.mealTag as MealTag) || 'None'; // Default to None if no mealTag
      acc[tag] = [...(acc[tag] || []), recipe];
      return acc;
    },
    {} as Record<MealTag, MealPlanRecipeWithRecipe[]>
  );

  // Group items by meal time
  const groupedItems = items.reduce(
    (acc, item) => {
      const tag = (item.mealTag as MealTag) || 'None'; // Default to None if no mealTag
      acc[tag] = [...(acc[tag] ?? []), item];
      return acc;
    },
    {} as Record<MealTag, MealPlanItemWithStore[]>
  );

  // Only include meal times that have recipes or items
  const mealTimesWithContent = mealTimeOrder.filter(
    mealTime =>
      (groupedRecipes[mealTime]?.length ?? 0) +
        (groupedItems[mealTime]?.length ?? 0) >
      0
  );

  // Empty state when no meals or items
  if (mealTimesWithContent.length === 0) {
    return (
      <Animated.View
        entering={FadeIn.duration(140)}
        exiting={FadeOut.duration(140)}
        className="flex-1 items-center justify-center px-4"
      >
        <View className="-mt-24">
          <EmptyHeading className="mt-4">No meals planned</EmptyHeading>
          <EmptySubtext>Tap the + button to add a meal</EmptySubtext>
        </View>
      </Animated.View>
    );
  }

  return (
    <>
      <FlatList
        contentContainerClassName="pb-20"
        data={mealTimesWithContent}
        keyExtractor={item => item}
        renderItem={({ item: mealTime }) => (
          <View className="mb-5">
            <Text className="px-4 text-lg font-semibold capitalize text-muted-foreground">
              {mealTime}
            </Text>
            <Animated.View
              entering={FadeIn.duration(140)}
              exiting={FadeOut.duration(140)}
            >
              <View>
                {groupedRecipes[mealTime]?.map((mealPlanRecipe, index) => {
                  const recipe = mealPlanRecipe.recipe;
                  if (!recipe) return null;
                  const recipesCount = groupedRecipes[mealTime]?.length ?? 0;
                  const itemsCount = groupedItems[mealTime]?.length ?? 0;
                  const isLast = index === recipesCount - 1 && itemsCount === 0;

                  return (
                    <MealPlanMealCard
                      key={mealPlanRecipe.id}
                      mealPlanRecipe={mealPlanRecipe}
                      recipe={recipe}
                      isLast={isLast}
                      onMealPress={onMealPress}
                      onIndicatorPress={handleRecipeIndicatorPress}
                    />
                  );
                })}
                {groupedItems[mealTime]?.map((mealPlanItem, index) => (
                  <MealPlanItemCard
                    key={mealPlanItem.id}
                    mealPlanItem={mealPlanItem}
                    isLast={index === (groupedItems[mealTime]?.length ?? 0) - 1}
                    onItemPress={onItemPress}
                    onIndicatorPress={handleItemIndicatorPress}
                  />
                ))}
              </View>
            </Animated.View>
          </View>
        )}
      />
      <BottomSheet
        name="meal-plan-quick-review-sheet"
        ref={quickReviewSheetRef}
        detents={[0.9]}
        scrollable
        onDismiss={handleQuickReviewDismiss}
        footer={
          <BottomSheet.SheetView className="flex-row gap-2 px-4 pb-safe pt-3">
            <Button
              variant="secondary"
              className="flex-1"
              onPress={closeQuickReviewSheet}
            >
              <Text>Cancel</Text>
            </Button>
            <Button
              className="flex-1"
              onPress={handleConfirmQuickAdd}
              disabled={isAddingToList}
            >
              <Text>{isAddingToList ? 'Adding...' : 'Add Meal to List'}</Text>
            </Button>
          </BottomSheet.SheetView>
        }
      >
        <BottomSheet.SheetView className="pb-safe">
          <BottomSheet.Header
            title={quickReviewMealPlanRecipe?.recipe.name ?? 'Review ingredients'}
            subsection={
              <BottomSheet.Subtext>
                Review or edit this meal&apos;s ingredients before adding to your grocery list.
              </BottomSheet.Subtext>
            }
          />
          {quickReviewRecipe ? (
            <View className="pb-20">
              <IngredientSelector
                recipe={quickReviewRecipe}
                mode="meal-plan"
                showHeader={false}
                showFooter={false}
                onBack={closeQuickReviewSheet}
                onDismiss={closeQuickReviewSheet}
                selectedIds={selectedQuickReviewIngredientIds}
                onToggleIngredient={id => {
                  void handleToggleQuickReviewIngredientSelection(id);
                }}
                onToggleAll={() => {
                  void handleToggleAllQuickReviewIngredientSelections();
                }}
                onEditIngredient={handleEditQuickReviewIngredient}
              />
            </View>
          ) : null}
          {isLoadingQuickReviewIngredients ||
          quickReviewSelectionMutation.isPending ||
          quickReviewOverrideMutation.isPending ? (
            <View className="px-4 pb-4">
              <Pill hasValue>
                {isLoadingQuickReviewIngredients
                  ? 'Loading ingredient selections...'
                  : quickReviewOverrideMutation.isPending
                    ? 'Saving ingredient override...'
                    : 'Saving ingredient selections...'}
              </Pill>
            </View>
          ) : null}
        </BottomSheet.SheetView>
      </BottomSheet>
      <MealPlanIngredientOverrideSheet
        ref={ingredientOverrideSheetRef}
        onSave={async ({ sourceRecipeIngredientId, updates }) => {
          const currentRow = quickReviewIngredientRows.find(
            row => row.sourceRecipeIngredientId === sourceRecipeIngredientId
          );
          if (!currentRow?.snapshotRowId) {
            throw new Error('Snapshot row not found');
          }

          setQuickReviewQueryRows(rows =>
            rows.map(row =>
              row.sourceRecipeIngredientId === sourceRecipeIngredientId
                ? applyMealPlanIngredientOverride({ row, updates })
                : row
            )
          );
          try {
            await quickReviewOverrideMutation.mutateAsync({
              snapshotRowId: currentRow.snapshotRowId,
              updates,
            });
          } catch (error) {
            setQuickReviewQueryRows(rows =>
              rows.map(row =>
                row.sourceRecipeIngredientId === sourceRecipeIngredientId
                  ? currentRow
                  : row
              )
            );
            throw error;
          }
        }}
      />
    </>
  );
};
