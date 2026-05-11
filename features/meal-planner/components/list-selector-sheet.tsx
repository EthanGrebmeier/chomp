import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { CheckIcon, ShoppingCartIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import { toast } from 'sonner-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { IngredientSelector } from '../../../components/item-sheet/add-item/ingredient-selector';
import { formatQuantityUnit } from '../../../components/item-sheet/unit-utils';
import { Button } from '../../../components/ui/button';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Icon } from '../../../components/ui/icon';
import { Pill } from '../../../components/ui/pill';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { RecipeCardContent } from '../../recipes/components/recipe-card';
import { useAddMealsToGroceryList, useUserMealPlanData } from '../hooks';
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
  MealPlanRecipeWithRecipe,
  MealTag,
} from '../types';
import {
  MealPlanIngredientOverrideSheet,
  MealPlanIngredientOverrideSheetRef,
} from './meal-plan-ingredient-override-sheet';

const mealTimeOrder: MealTag[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Dessert',
  'None',
];

const formatMealPlanDate = (dateStr: string): string => {
  try {
    const [datePart] = dateStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    return format(parsedDate, 'EEE, MMM d');
  } catch {
    return '';
  }
};

type MealPlanRowProps = {
  name: string;
  mealTag?: string;
  detail?: string;
  trailing?: string;
  isSelected: boolean;
  onToggle: () => void;
};

const MealPlanRow = ({
  name,
  mealTag,
  detail,
  trailing,
  isSelected,
  onToggle,
}: MealPlanRowProps) => {
  const compactTextStyle = Platform.select({
    android: { includeFontPadding: false },
    default: undefined,
  });

  const metaParts: string[] = [];
  if (mealTag && mealTag !== 'None') metaParts.push(mealTag);
  if (detail) metaParts.push(detail);

  return (
    <HapticPressable
      onPress={onToggle}
      hapticType="selection"
      className={cn(
        'mb-2 flex-row items-center gap-3 rounded-xl px-4 py-2 transition-colors',
        isSelected ? 'bg-muted' : 'bg-muted/50'
      )}
    >
      <View
        className={cn(
          'size-6 items-center justify-center rounded-full',
          isSelected
            ? 'bg-primary'
            : 'border-2 border-dashed border-muted-foreground/40'
        )}
      >
        {isSelected && (
          <Icon
            strokeWidth={3}
            as={CheckIcon}
            size={14}
            className="text-primary-foreground"
          />
        )}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text
            className={cn(
              'flex-1 text-xl leading-[22px] tracking-tight',
              isSelected ? 'text-foreground' : 'text-muted-foreground'
            )}
            style={compactTextStyle}
          >
            {name}
          </Text>
          {trailing && (
            <Text
              className="ml-2 text-base leading-[22px] text-muted-foreground"
              style={compactTextStyle}
            >
              {trailing}
            </Text>
          )}
        </View>
        {metaParts.length > 0 && (
          <Text
            className="text-base leading-[18px] text-muted-foreground"
            style={compactTextStyle}
          >
            {metaParts.join(' · ')}
          </Text>
        )}
      </View>
    </HapticPressable>
  );
};

type MealPlanRecipeRowProps = {
  name: string;
  ingredientCount: number;
  mealTag?: string;
  trailing?: string;
  isSelected: boolean;
  onToggle: () => void;
  onReview: () => void;
};

const MealPlanRecipeRow = ({
  name,
  ingredientCount,
  mealTag,
  trailing,
  isSelected,
  onToggle,
  onReview,
}: MealPlanRecipeRowProps) => {
  const compactTextStyle = Platform.select({
    android: { includeFontPadding: false },
    default: undefined,
  });

  const subtitle =
    mealTag && mealTag !== 'None'
      ? `${ingredientCount} ingredient${ingredientCount === 1 ? '' : 's'} · ${mealTag}`
      : undefined;

  return (
    <View
      className={cn(
        'mb-2 rounded-xl px-4 py-2',
        isSelected ? 'bg-muted' : 'bg-muted/50'
      )}
    >
      <View className="flex-row items-center gap-2">
        <HapticPressable
          onPress={onToggle}
          hapticType="selection"
          className="flex-1 flex-row items-center gap-3"
        >
          <View
            className={cn(
              'size-6 items-center justify-center rounded-full',
              isSelected
                ? 'bg-primary'
                : 'border-2 border-dashed border-muted-foreground/40'
            )}
          >
            {isSelected ? (
              <Icon
                strokeWidth={3}
                as={CheckIcon}
                size={14}
                className="text-primary-foreground"
              />
            ) : null}
          </View>
          <View className="flex-1 flex-row items-center gap-2">
            <RecipeCardContent
              name={name}
              ingredientCount={ingredientCount}
              subtitle={subtitle}
              className="flex-1"
              titleClassName={cn(
                isSelected ? 'text-foreground' : 'text-muted-foreground'
              )}
              subtitleClassName={
                !isSelected ? 'text-muted-foreground/80' : undefined
              }
            />
            {trailing ? (
              <Text
                className="text-base leading-[22px] text-muted-foreground"
                style={compactTextStyle}
              >
                {trailing}
              </Text>
            ) : null}
          </View>
        </HapticPressable>
        <Button variant="ghost" size="sm" onPress={onReview}>
          <Text>Review</Text>
        </Button>
      </View>
    </View>
  );
};

type ListSelectorSheetProps = {
  listId: string;
};

export const ListSelectorSheet = ({ listId }: ListSelectorSheetProps) => {
  const sheetRef = useRef<TrueSheet>(null);
  const reviewSheetRef = useRef<TrueSheet>(null);
  const ingredientOverrideSheetRef =
    useRef<MealPlanIngredientOverrideSheetRef>(null);
  const isDarkMode = useColorScheme() === 'dark';
  // Track deselected IDs instead of selected — everything is selected by default
  const [deselectedIds, setDeselectedIds] = useState<Set<string>>(new Set());
  const { recipes, items, isLoading } = useUserMealPlanData(listId);
  const { mutate: addMealsToGroceryList, isPending: isAddingToList } =
    useAddMealsToGroceryList();
  const [reviewMealPlanRecipe, setReviewMealPlanRecipe] =
    useState<MealPlanRecipeWithRecipe | null>(null);
  const [reviewIngredientRows, setReviewIngredientRows] = useState<
    MealPlanIngredientEditorRow[]
  >([]);
  const [isLoadingReviewIngredients, setIsLoadingReviewIngredients] =
    useState(false);
  const [isPersistingReviewSelection, setIsPersistingReviewSelection] =
    useState(false);
  const [isPersistingReviewOverride, setIsPersistingReviewOverride] =
    useState(false);

  type UnaddedRecipe = {
    kind: 'recipe';
    id: string;
    date: string;
    mealTag?: string;
    recipe: MealPlanRecipeWithRecipe;
  };

  type UnaddedItem = {
    kind: 'item';
    id: string;
    date: string;
    mealTag?: string;
    item: MealPlanItemWithStore;
  };

  type UnaddedEntry = UnaddedRecipe | UnaddedItem;
  type DaySection = {
    date: string;
    label: string;
    entries: UnaddedEntry[];
  };

  const {
    sortedEntries,
    unaddedRecipeIds,
    unaddedItemIds,
    unaddedCount,
    subtext,
  } = useMemo(() => {
    const mealTagIndex = (tag?: string): number => {
      const idx = mealTimeOrder.indexOf((tag ?? 'None') as MealTag);
      return idx === -1 ? mealTimeOrder.length : idx;
    };

    const filteredRecipes = recipes.filter(r => !r.addedToList);
    const filteredItems = items.filter(i => !i.addedToList);

    const entries: UnaddedEntry[] = [
      ...filteredRecipes.map(
        (r): UnaddedRecipe => ({
          kind: 'recipe',
          id: r.id,
          date: r.date,
          mealTag: r.mealTag,
          recipe: r,
        })
      ),
      ...filteredItems.map(
        (i): UnaddedItem => ({
          kind: 'item',
          id: i.id,
          date: i.date,
          mealTag: i.mealTag,
          item: i,
        })
      ),
    ];

    entries.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return mealTagIndex(a.mealTag) - mealTagIndex(b.mealTag);
    });

    const parts: string[] = [];

    if (filteredRecipes.length > 0) {
      parts.push(
        `${filteredRecipes.length} recipe${filteredRecipes.length === 1 ? '' : 's'}`
      );
    }

    if (filteredItems.length > 0) {
      parts.push(
        `${filteredItems.length} item${filteredItems.length === 1 ? '' : 's'}`
      );
    }

    const summary = parts.length === 0 ? 'no items' : parts.join(' and ');

    return {
      sortedEntries: entries,
      unaddedRecipeIds: new Set(filteredRecipes.map(r => r.id)),
      unaddedItemIds: new Set(filteredItems.map(i => i.id)),
      unaddedCount: filteredRecipes.length + filteredItems.length,
      subtext: `You have ${summary} to add`,
    };
  }, [recipes, items]);

  const daySections = useMemo(() => {
    const sectionsMap = new Map<string, DaySection>();

    sortedEntries.forEach(entry => {
      const existing = sectionsMap.get(entry.date);
      if (existing) {
        existing.entries.push(entry);
        return;
      }

      sectionsMap.set(entry.date, {
        date: entry.date,
        label: formatMealPlanDate(entry.date),
        entries: [entry],
      });
    });

    return Array.from(sectionsMap.values());
  }, [sortedEntries]);

  const isSelected = useCallback(
    (id: string) => !deselectedIds.has(id),
    [deselectedIds]
  );

  const resetSelection = useCallback(() => {
    setDeselectedIds(new Set());
  }, []);

  const toggleItem = useCallback((itemId: string) => {
    setDeselectedIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const handleSheetClose = useCallback(() => {
    resetSelection();
  }, [resetSelection]);

  const closeReviewSheet = useCallback(() => {
    reviewSheetRef.current?.dismiss();
  }, []);

  const handleReviewDismiss = useCallback(() => {
    setReviewMealPlanRecipe(null);
    setReviewIngredientRows([]);
    setIsLoadingReviewIngredients(false);
    setIsPersistingReviewSelection(false);
    setIsPersistingReviewOverride(false);
    ingredientOverrideSheetRef.current?.dismiss();
  }, []);

  const handleOpenSheet = useCallback(() => {
    resetSelection();
    sheetRef.current?.present();
  }, [resetSelection]);

  const handleAddToList = () => {
    if (isAddingToList) return;

    const selectedRecipeIds = [...unaddedRecipeIds].filter(id =>
      isSelected(id)
    );
    const skippedRecipeIds = [...unaddedRecipeIds].filter(
      id => !isSelected(id)
    );
    const selectedItemIds = [...unaddedItemIds].filter(id => isSelected(id));
    const skippedItemIds = [...unaddedItemIds].filter(id => !isSelected(id));

    addMealsToGroceryList(
      {
        listId,
        // Always pass arrays so the backend can distinguish "add none" from "add all"
        selectedRecipeIds,
        skippedRecipeIds:
          skippedRecipeIds.length > 0 ? skippedRecipeIds : undefined,
        selectedItemIds,
        skippedItemIds: skippedItemIds.length > 0 ? skippedItemIds : undefined,
      },
      {
        onSuccess: result => {
          const totalAdded = result.addedRecipes + result.addedItems;
          if (totalAdded === 0) {
            toast.info('No new meals to add - all meals already added to list');
          } else {
            toast.success(
              `Added ${totalAdded} item${totalAdded > 1 ? 's' : ''} to list`
            );
          }
          sheetRef.current?.dismiss();
          router.back();
        },
        onError: () => {
          toast.error('Failed to add meals to list');
        },
      }
    );
  };

  const selectedReviewIngredientIds = useMemo(
    () => getSelectedSourceIngredientIds(reviewIngredientRows),
    [reviewIngredientRows]
  );

  const handleOpenReview = useCallback((mealPlanRecipe: MealPlanRecipeWithRecipe) => {
    setReviewMealPlanRecipe(mealPlanRecipe);
    reviewSheetRef.current?.present();
  }, []);

  const handleToggleReviewIngredientSelection = useCallback(
    async (sourceRecipeIngredientId: string) => {
      const currentRow = reviewIngredientRows.find(
        row => row.sourceRecipeIngredientId === sourceRecipeIngredientId
      );
      if (!currentRow) return;

      const nextIsSelected = !currentRow.isSelected;
      setReviewIngredientRows(prev =>
        toggleMealPlanIngredientSelection(prev, sourceRecipeIngredientId)
      );

      if (!currentRow.snapshotRowId) return;

      setIsPersistingReviewSelection(true);
      try {
        await MealPlanIngredientSnapshotStore.updateRowSelection({
          snapshotRowId: currentRow.snapshotRowId,
          isSelected: nextIsSelected,
        });
      } catch {
        setReviewIngredientRows(prev =>
          prev.map(row =>
            row.sourceRecipeIngredientId === sourceRecipeIngredientId
              ? { ...row, isSelected: currentRow.isSelected }
              : row
          )
        );
        toast.error('Failed to save ingredient selection');
      } finally {
        setIsPersistingReviewSelection(false);
      }
    },
    [reviewIngredientRows]
  );

  const handleToggleAllReviewIngredientSelections = useCallback(async () => {
    if (reviewIngredientRows.length === 0) return;

    const previousRows = reviewIngredientRows;
    const nextRows = toggleAllMealPlanIngredientSelection(previousRows);
    const nextIsSelected = nextRows[0]?.isSelected ?? true;

    setReviewIngredientRows(nextRows);
    setIsPersistingReviewSelection(true);
    try {
      await Promise.all(
        previousRows
          .filter(row => row.snapshotRowId)
          .map(row =>
            MealPlanIngredientSnapshotStore.updateRowSelection({
              snapshotRowId: row.snapshotRowId as string,
              isSelected: nextIsSelected,
            })
          )
      );
    } catch {
      setReviewIngredientRows(previousRows);
      toast.error('Failed to save ingredient selections');
    } finally {
      setIsPersistingReviewSelection(false);
    }
  }, [reviewIngredientRows]);

  const handleEditReviewIngredient = useCallback(
    (sourceRecipeIngredientId: string) => {
      const row = reviewIngredientRows.find(
        ingredientRow =>
          ingredientRow.sourceRecipeIngredientId === sourceRecipeIngredientId
      );
      if (!row) return;
      ingredientOverrideSheetRef.current?.present(row);
    },
    [reviewIngredientRows]
  );

  const reviewRecipeWithIngredients = reviewMealPlanRecipe?.recipe ?? null;

  useEffect(() => {
    if (!reviewMealPlanRecipe || !reviewRecipeWithIngredients) {
      setReviewIngredientRows([]);
      return;
    }

    let isCancelled = false;

    const loadRows = async () => {
      setIsLoadingReviewIngredients(true);
      try {
        const snapshotRows =
          await MealPlanIngredientSnapshotStore.ensureBackfilledSnapshot(
            reviewMealPlanRecipe.id
          );
        const reconciledRows = await MealPlanIngredientSnapshotStore.reconcileSnapshot(
          reviewMealPlanRecipe.id
        );
        if (isCancelled) return;

        setReviewIngredientRows(
          hydrateMealPlanIngredientEditorFromSnapshot({
            sourceIngredients: reviewRecipeWithIngredients.recipe_ingredients ?? [],
            snapshotRows: reconciledRows.length > 0 ? reconciledRows : snapshotRows,
          })
        );
      } catch {
        if (!isCancelled) {
          toast.error('Failed to load meal ingredient selections');
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingReviewIngredients(false);
        }
      }
    };

    void loadRows();

    return () => {
      isCancelled = true;
    };
  }, [reviewMealPlanRecipe, reviewRecipeWithIngredients]);

  return (
    <>
      <BottomSheet
        name="add-meals-to-list-sheet"
        ref={sheetRef}
        detents={[0.8, 'auto']}
        scrollable
        onStartClose={handleSheetClose}
        viewClassName="pb-safe"
        footer={
          <>
            <View className="z-10 px-10 pb-4">
              <Button
                onPress={handleAddToList}
                disabled={isAddingToList || unaddedCount === 0}
              >
                <Text>
                  {isAddingToList ? 'Adding...' : 'Add to Grocery List'}
                </Text>
              </Button>
            </View>
            <LinearGradient
              colors={
                isDarkMode
                  ? ['rgba(0,0,0,0.9)', 'rgba(0,0,0,0)']
                  : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']
              }
              start={{ x: 0.5, y: 1 }}
              end={{ x: 0.5, y: 0 }}
              pointerEvents="none"
              style={styles.footerGradient}
            />
          </>
        }
      >
        <View>
          <BottomSheet.Header
            className="mb-0 px-4"
            title="Add to Grocery List"
            subsection={
              <>
                <BottomSheet.Subtext className="px-16">
                  {isLoading
                    ? 'Loading meals…'
                    : unaddedCount === 0
                      ? 'No meals to add.'
                      : `${subtext}. Select the meals you want to add to your grocery list.`}
                </BottomSheet.Subtext>
                {unaddedCount === 0 && (
                  <BottomSheet.Subtext className="px-6">
                    <Text>Add meals to your meal plan to see them here.</Text>
                  </BottomSheet.Subtext>
                )}
              </>
            }
          />

          <ScrollView
            className="px-4"
            contentContainerStyle={{ paddingBottom: 80 }}
          >
            {isLoading ? (
              <View className="items-center justify-center py-12">
                <ActivityIndicator size="small" />
                <Text className="mt-2 text-sm text-muted-foreground">
                  Loading meals…
                </Text>
              </View>
            ) : (
              daySections.map(section => (
                <View key={section.date} className="mb-2">
                  <Text className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {section.label}
                  </Text>
                  {section.entries.map(entry => {
                    if (entry.kind === 'recipe') {
                      const { recipe: mealPlanRecipe } = entry;
                      const recipe = mealPlanRecipe.recipe;
                      const ingredientCount =
                        recipe.recipe_ingredients?.length ?? 0;
                      const servings = mealPlanRecipe.servings || 1;
                      return (
                        <MealPlanRecipeRow
                          key={mealPlanRecipe.id}
                          name={recipe.name}
                          mealTag={mealPlanRecipe.mealTag}
                          ingredientCount={ingredientCount}
                          trailing={servings > 1 ? `x${servings}` : undefined}
                          isSelected={isSelected(mealPlanRecipe.id)}
                          onToggle={() => toggleItem(mealPlanRecipe.id)}
                          onReview={() => handleOpenReview(mealPlanRecipe)}
                        />
                      );
                    }

                    const { item } = entry;
                    return (
                      <MealPlanRow
                        key={item.id}
                        name={item.name}
                        mealTag={item.mealTag}
                        trailing={formatQuantityUnit(item.quantity, item.unit)}
                        isSelected={isSelected(item.id)}
                        onToggle={() => toggleItem(item.id)}
                      />
                    );
                  })}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </BottomSheet>
      <BottomSheet
        name="meal-plan-bulk-review-sheet"
        ref={reviewSheetRef}
        detents={[0.9]}
        scrollable
        onDismiss={handleReviewDismiss}
      >
        <BottomSheet.SheetView className="pb-safe">
          <BottomSheet.Header
            title={reviewMealPlanRecipe?.recipe.name ?? 'Review ingredients'}
            subsection={
              <BottomSheet.Subtext>
                Update ingredient selections before adding this meal.
              </BottomSheet.Subtext>
            }
          />
          {reviewRecipeWithIngredients ? (
            <View className="pb-20">
              <IngredientSelector
                recipe={reviewRecipeWithIngredients}
                mode="meal-plan"
                showHeader={false}
                showFooter={false}
                onBack={closeReviewSheet}
                onDismiss={closeReviewSheet}
                selectedIds={selectedReviewIngredientIds}
                onToggleIngredient={id => {
                  void handleToggleReviewIngredientSelection(id);
                }}
                onToggleAll={() => {
                  void handleToggleAllReviewIngredientSelections();
                }}
                onEditIngredient={handleEditReviewIngredient}
              />
            </View>
          ) : null}
          {isLoadingReviewIngredients ||
          isPersistingReviewSelection ||
          isPersistingReviewOverride ? (
            <View className="px-4 pb-4">
              <Pill hasValue>
                {isLoadingReviewIngredients
                  ? 'Loading ingredient selections...'
                  : isPersistingReviewOverride
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
          const currentRow = reviewIngredientRows.find(
            row => row.sourceRecipeIngredientId === sourceRecipeIngredientId
          );
          if (!currentRow?.snapshotRowId) {
            throw new Error('Snapshot row not found');
          }

          setReviewIngredientRows(prev =>
            prev.map(row =>
              row.sourceRecipeIngredientId === sourceRecipeIngredientId
                ? applyMealPlanIngredientOverride({ row, updates })
                : row
            )
          );

          setIsPersistingReviewOverride(true);
          try {
            await MealPlanIngredientSnapshotStore.updateRowOverrides({
              snapshotRowId: currentRow.snapshotRowId,
              updates,
            });
          } catch (error) {
            setReviewIngredientRows(prev =>
              prev.map(row =>
                row.sourceRecipeIngredientId === sourceRecipeIngredientId
                  ? currentRow
                  : row
              )
            );
            throw error;
          } finally {
            setIsPersistingReviewOverride(false);
          }
        }}
      />
      <Button
        size="iconLg"
        variant="secondary"
        className={cn(
          'absolute bottom-12 left-6 z-10 h-10 w-24 transition-opacity',
          unaddedCount === 0 && 'opacity-50'
        )}
        onPress={handleOpenSheet}
        disabled={isAddingToList}
      >
        <View className="flex-row items-center gap-2">
          <Icon
            as={ShoppingCartIcon}
            size={20}
            strokeWidth={3}
            className="text-secondary-foreground"
          />
          {unaddedCount > 0 && (
            <Text className="text-xl font-bold text-secondary-foreground">
              {unaddedCount}
            </Text>
          )}
        </View>
      </Button>
    </>
  );
};

ListSelectorSheet.displayName = 'ListSelectorSheet';

const styles = StyleSheet.create({
  footerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 0,
  },
});
