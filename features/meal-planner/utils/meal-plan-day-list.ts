import { addDays, format, isSameDay, startOfDay, subDays } from 'date-fns';

export const MEAL_PLAN_DAY_LIST_PAST_DAYS = 0;
export const MEAL_PLAN_DAY_LIST_FUTURE_DAYS = 30;

type DatedEntry = {
  id: string;
  date: string;
};

export type MealPlanEntryIdentity = {
  type: 'recipe' | 'item';
  id: string;
  date: string;
};

export type MoveMealPlanEntry = (
  entry: MealPlanEntryIdentity,
  targetDate: string
) => void | Promise<void>;

export type MealPlanDayListEntry<
  TRecipe extends DatedEntry,
  TItem extends DatedEntry,
> =
  | {
      type: 'recipe';
      id: string;
      date: string;
      value: TRecipe;
    }
  | {
      type: 'item';
      id: string;
      date: string;
      value: TItem;
    };

export type MealPlanDayListSection<
  TRecipe extends DatedEntry,
  TItem extends DatedEntry,
> = {
  date: Date;
  dateKey: string;
  label: string;
  isToday: boolean;
  entries: MealPlanDayListEntry<TRecipe, TItem>[];
};

export const createMealPlanDayEntries = <
  TRecipe extends DatedEntry,
  TItem extends DatedEntry,
>(
  recipes: readonly TRecipe[],
  items: readonly TItem[]
): MealPlanDayListEntry<TRecipe, TItem>[] => [
  ...recipes.map(recipe => ({
    type: 'recipe' as const,
    id: recipe.id,
    date: recipe.date,
    value: recipe,
  })),
  ...items.map(item => ({
    type: 'item' as const,
    id: item.id,
    date: item.date,
    value: item,
  })),
];

export const buildMealPlanDayListSections = <
  TRecipe extends DatedEntry,
  TItem extends DatedEntry,
>({
  anchorDate,
  recipes,
  items,
}: {
  anchorDate: Date;
  recipes: readonly TRecipe[];
  items: readonly TItem[];
}): MealPlanDayListSection<TRecipe, TItem>[] => {
  const today = startOfDay(anchorDate);
  const firstDate = subDays(today, MEAL_PLAN_DAY_LIST_PAST_DAYS);
  const recipesByDate = new Map<string, TRecipe[]>();
  const itemsByDate = new Map<string, TItem[]>();

  recipes.forEach(recipe => {
    const dateRecipes = recipesByDate.get(recipe.date) ?? [];
    dateRecipes.push(recipe);
    recipesByDate.set(recipe.date, dateRecipes);
  });
  items.forEach(item => {
    const dateItems = itemsByDate.get(item.date) ?? [];
    dateItems.push(item);
    itemsByDate.set(item.date, dateItems);
  });

  const dayCount =
    MEAL_PLAN_DAY_LIST_PAST_DAYS + MEAL_PLAN_DAY_LIST_FUTURE_DAYS + 1;

  return Array.from({ length: dayCount }, (_, index) => {
    const date = addDays(firstDate, index);
    const dateKey = format(date, 'yyyy-MM-dd');

    return {
      date,
      dateKey,
      label: format(date, 'MMM d - EEEE'),
      isToday: isSameDay(date, today),
      entries: createMealPlanDayEntries(
        recipesByDate.get(dateKey) ?? [],
        itemsByDate.get(dateKey) ?? []
      ),
    };
  });
};
