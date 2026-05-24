import { FlashList, FlashListRef } from '@shopify/flash-list';
import { addDays, format, startOfWeek } from 'date-fns';
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { View } from 'react-native';

import { formatQuantityUnit } from '../../../components/item-sheet/unit-utils';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Text } from '../../../components/ui/text';
import { Recipe } from '../../recipes/types';
import { MealPlanItemWithStore, MealPlanRecipeWithRecipe } from '../types';

type GridMealSlot = 'Breakfast' | 'Lunch' | 'Dinner' | 'None';

type GridCellEntries = {
  recipes: MealPlanRecipeWithRecipe[];
  items: MealPlanItemWithStore[];
};

type WeekGridRow = {
  date: Date;
  dateKey: string;
  dayLabel: string;
  cells: Record<GridMealSlot, GridCellEntries>;
};

type MealPlanWeekGridViewProps = {
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

export type MealPlanWeekGridViewRef = {
  scrollToToday: () => void;
};

const GRID_COLUMNS: GridMealSlot[] = ['Breakfast', 'Lunch', 'Dinner', 'None'];

const createEmptyCells = (): Record<GridMealSlot, GridCellEntries> => ({
  Breakfast: { recipes: [], items: [] },
  Lunch: { recipes: [], items: [] },
  Dinner: { recipes: [], items: [] },
  None: { recipes: [], items: [] },
});

const normalizeMealSlot = (mealTag?: string | null): GridMealSlot => {
  if (mealTag === 'Breakfast' || mealTag === 'Lunch' || mealTag === 'Dinner') {
    return mealTag;
  }
  return 'None';
};

export const MealPlanWeekGridView = forwardRef<
  MealPlanWeekGridViewRef,
  MealPlanWeekGridViewProps
>(({ recipes, items, onDayPress, onMealPress, onItemPress }, ref) => {
  const listRef = useRef<FlashListRef<WeekGridRow> | null>(null);

  const weekRows = useMemo<WeekGridRow[]>(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const weekDays = Array.from({ length: 7 }, (_, index) =>
      addDays(weekStart, index)
    );
    const rowByDate = new Map<string, WeekGridRow>();

    weekDays.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      rowByDate.set(dateKey, {
        date: day,
        dateKey,
        dayLabel: format(day, 'EE').toUpperCase(),
        cells: createEmptyCells(),
      });
    });

    recipes.forEach(mealPlanRecipe => {
      const row = rowByDate.get(mealPlanRecipe.date);
      if (!row) return;
      const slot = normalizeMealSlot(mealPlanRecipe.mealTag);
      row.cells[slot].recipes.push(mealPlanRecipe);
    });

    items.forEach(mealPlanItem => {
      const row = rowByDate.get(mealPlanItem.date);
      if (!row) return;
      const slot = normalizeMealSlot(mealPlanItem.mealTag);
      row.cells[slot].items.push(mealPlanItem);
    });

    return weekDays
      .map(day => rowByDate.get(format(day, 'yyyy-MM-dd')))
      .filter((row): row is WeekGridRow => row != null);
  }, [items, recipes]);

  useImperativeHandle(
    ref,
    () => ({
      scrollToToday: () => {
        listRef.current?.scrollToOffset({
          offset: 0,
          animated: true,
        });
      },
    }),
    []
  );

  return (
    <View className="flex-1 px-4 pb-24">
      <View className="flex-1 rounded-2xl border border-border/70 bg-card">
        <View className="flex-row border-b border-border/70 bg-muted/30">
          <View className="w-12 items-center justify-center px-1 py-2">
            <Text className="text-xs font-semibold uppercase text-muted-foreground">
              Day
            </Text>
          </View>
          {GRID_COLUMNS.map(column => (
            <View
              key={column}
              className="flex-1 items-center justify-center border-l border-border/70 px-1 py-2"
            >
              <Text className="text-xs font-semibold text-foreground">
                {column}
              </Text>
            </View>
          ))}
        </View>
        <FlashList
          ref={listRef}
          data={weekRows}
          style={{ flex: 1 }}
          keyExtractor={item => item.dateKey}
          renderItem={({ item: row, index }) => (
            <View
              className={`flex-row ${index < weekRows.length - 1 ? 'border-b border-border/70' : ''}`}
            >
              <HapticPressable
                className="w-12 items-center justify-center px-1 py-3"
                onPress={() => onDayPress(row.dateKey)}
                hapticType="selection"
              >
                <Text className="text-sm font-semibold text-foreground">
                  {row.dayLabel}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {format(row.date, 'd')}
                </Text>
              </HapticPressable>

              {GRID_COLUMNS.map(slot => {
                const slotEntries = row.cells[slot];
                return (
                  <View
                    key={`${row.dateKey}-${slot}`}
                    className="flex-1 border-l border-border/70 px-1.5 py-1.5"
                  >
                    {slotEntries.recipes.map(mealPlanRecipe => {
                      const recipe = mealPlanRecipe.recipe;
                      if (!recipe) return null;
                      return (
                        <HapticPressable
                          key={mealPlanRecipe.id}
                          onPress={() => onMealPress({ mealPlanRecipe, recipe })}
                          hapticType="selection"
                          className="mb-1 rounded-md border border-border/60 bg-background px-1.5 py-1"
                        >
                          <Text className="text-xs font-medium text-foreground">
                            {recipe.name}
                          </Text>
                        </HapticPressable>
                      );
                    })}

                    {slotEntries.items.map(mealPlanItem => (
                      <HapticPressable
                        key={mealPlanItem.id}
                        onPress={() => onItemPress(mealPlanItem)}
                        hapticType="selection"
                        className="mb-1 rounded-md border border-dashed border-border/60 bg-background px-1.5 py-1"
                      >
                        <Text className="text-xs font-medium text-foreground">
                          {mealPlanItem.name}
                        </Text>
                        <Text className="text-[10px] text-muted-foreground">
                          {formatQuantityUnit(mealPlanItem.quantity, mealPlanItem.unit)}
                        </Text>
                      </HapticPressable>
                    ))}
                  </View>
                );
              })}
            </View>
          )}
        />
      </View>
    </View>
  );
});

MealPlanWeekGridView.displayName = 'MealPlanWeekGridView';
