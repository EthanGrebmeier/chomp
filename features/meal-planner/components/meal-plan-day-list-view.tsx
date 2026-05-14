import { FlashList, FlashListRef } from '@shopify/flash-list';
import { format } from 'date-fns';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { View } from 'react-native';

import { formatQuantityUnit } from '../../../components/item-sheet/unit-utils';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Pill } from '../../../components/ui/pill';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { Recipe } from '../../recipes/types';
import { MealPlanItemWithStore, MealPlanRecipeWithRecipe, MealTag } from '../types';

type DayListRow = {
  key: string;
  date: string;
  label: string;
  isToday: boolean;
  recipes: MealPlanRecipeWithRecipe[];
  items: MealPlanItemWithStore[];
};

type MealPlanDayListViewProps = {
  daysOfPlan: Date[];
  todayIndex: number;
  recipes: MealPlanRecipeWithRecipe[];
  items: MealPlanItemWithStore[];
  onDayPress: (date: string) => void;
  onMealPress: ({
    mealPlanRecipe,
    recipe,
  }: {
    mealPlanRecipe: MealPlanRecipeWithRecipe;
    recipe: Recipe;
  }) => void;
  onItemPress: (item: MealPlanItemWithStore) => void;
};

export type MealPlanDayListViewRef = {
  scrollToToday: () => void;
};

const mealTimeOrder: MealTag[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Dessert',
  'None',
];

export const MealPlanDayListView = forwardRef<
  MealPlanDayListViewRef,
  MealPlanDayListViewProps
>(
  (
    {
      daysOfPlan,
      todayIndex,
      recipes,
      items,
      onDayPress,
      onMealPress,
      onItemPress,
    },
    ref
  ) => {
    const listRef = useRef<FlashListRef<DayListRow> | null>(null);
    const rows = useMemo<DayListRow[]>(() => {
    const recipesByDate = new Map<string, MealPlanRecipeWithRecipe[]>();
    const itemsByDate = new Map<string, MealPlanItemWithStore[]>();

    recipes.forEach(recipe => {
      const existing = recipesByDate.get(recipe.date) ?? [];
      existing.push(recipe);
      recipesByDate.set(recipe.date, existing);
    });

    items.forEach(item => {
      const existing = itemsByDate.get(item.date) ?? [];
      existing.push(item);
      itemsByDate.set(item.date, existing);
    });

    return daysOfPlan.map(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const rowRecipes = recipesByDate.get(dateKey) ?? [];
      const rowItems = itemsByDate.get(dateKey) ?? [];

      rowRecipes.sort((a, b) => {
        const aIndex = mealTimeOrder.indexOf((a.mealTag ?? 'None') as MealTag);
        const bIndex = mealTimeOrder.indexOf((b.mealTag ?? 'None') as MealTag);
        return (aIndex === -1 ? mealTimeOrder.length : aIndex) -
          (bIndex === -1 ? mealTimeOrder.length : bIndex);
      });

      rowItems.sort((a, b) => {
        const aIndex = mealTimeOrder.indexOf((a.mealTag ?? 'None') as MealTag);
        const bIndex = mealTimeOrder.indexOf((b.mealTag ?? 'None') as MealTag);
        return (aIndex === -1 ? mealTimeOrder.length : aIndex) -
          (bIndex === -1 ? mealTimeOrder.length : bIndex);
      });

      return {
        key: dateKey,
        date: dateKey,
        label: format(date, 'EEEE, MMM d'),
        isToday: dateKey === format(new Date(), 'yyyy-MM-dd'),
        recipes: rowRecipes,
        items: rowItems,
      };
    });
    }, [daysOfPlan, items, recipes]);
    const clampedTodayIndex = Math.max(0, Math.min(todayIndex, rows.length - 1));

    useImperativeHandle(
      ref,
      () => ({
        scrollToToday: () => {
          if (rows.length === 0) return;
          listRef.current?.scrollToIndex({
            index: clampedTodayIndex,
            animated: true,
          });
        },
      }),
      [clampedTodayIndex, rows.length]
    );

    return (
      <FlashList
        ref={listRef}
        data={rows}
        keyExtractor={item => item.key}
        initialScrollIndex={clampedTodayIndex}
        contentContainerClassName="pb-24"
        renderItem={({ item: row }) => {
          const isEmpty = row.recipes.length === 0 && row.items.length === 0;

          return (
            <View className="px-4 pb-3">
              <HapticPressable
                onPress={() => onDayPress(row.date)}
                hapticType="selection"
                className={cn(
                  'flex-row items-center gap-2 rounded-lg',
                  isEmpty ? 'py-1.5' : 'py-2.5'
                )}
              >
                <Text
                  className={cn(
                    'font-semibold text-foreground',
                    isEmpty ? 'text-base text-muted-foreground' : 'text-lg'
                  )}
                >
                  {row.label}
                </Text>
                {row.isToday ? (
                  <Pill hasValue className="px-2 py-0.5">
                    Today
                  </Pill>
                ) : null}
              </HapticPressable>

              {isEmpty ? null : (
                <View className="rounded-2xl border border-border/70 bg-card">
                  {row.recipes.map((mealPlanRecipe, index) => {
                    const recipe = mealPlanRecipe.recipe;
                    if (!recipe) return null;
                    const ingredientCount =
                      mealPlanRecipe.ingredient_snapshots?.filter(
                        snapshot => snapshot.isSelected
                      ).length ??
                      recipe.recipe_ingredients?.length ??
                      0;
                    const mealMeta =
                      mealPlanRecipe.mealTag && mealPlanRecipe.mealTag !== 'None'
                        ? mealPlanRecipe.mealTag
                        : null;

                    return (
                      <HapticPressable
                        key={mealPlanRecipe.id}
                        onPress={() =>
                          onMealPress({
                            mealPlanRecipe,
                            recipe,
                          })
                        }
                        className={cn(
                          'px-3 py-2.5',
                          index < row.recipes.length - 1 ||
                            row.items.length > 0
                            ? 'border-b border-dashed border-border'
                            : null
                        )}
                      >
                        <Text className="text-base font-medium text-foreground">
                          {recipe.name}
                        </Text>
                        <Text className="text-sm text-muted-foreground">
                          {mealMeta
                            ? `${mealMeta} · ${ingredientCount} ingredient${ingredientCount === 1 ? '' : 's'}`
                            : `${ingredientCount} ingredient${ingredientCount === 1 ? '' : 's'}`}
                        </Text>
                      </HapticPressable>
                    );
                  })}

                  {row.items.map((mealPlanItem, index) => (
                    <HapticPressable
                      key={mealPlanItem.id}
                      onPress={() => onItemPress(mealPlanItem)}
                      className={cn(
                        'px-3 py-2.5',
                        index < row.items.length - 1
                          ? 'border-b border-dashed border-border'
                          : null
                      )}
                    >
                      <View className="flex-row items-center justify-between gap-3">
                        <Text className="flex-1 text-base font-medium text-foreground">
                          {mealPlanItem.name}
                        </Text>
                        <Text className="text-sm text-muted-foreground">
                          {formatQuantityUnit(mealPlanItem.quantity, mealPlanItem.unit)}
                        </Text>
                      </View>
                      {mealPlanItem.mealTag && mealPlanItem.mealTag !== 'None' ? (
                        <Text className="text-sm text-muted-foreground">
                          {mealPlanItem.mealTag}
                        </Text>
                      ) : null}
                    </HapticPressable>
                  ))}
                </View>
              )}
            </View>
          );
        }}
      />
    );
  }
);

MealPlanDayListView.displayName = 'MealPlanDayListView';
