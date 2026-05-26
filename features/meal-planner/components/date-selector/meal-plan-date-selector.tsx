import {
  addDays,
  addWeeks,
  format,
  isSameDay,
  isToday,
  startOfWeek,
} from 'date-fns';
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, useWindowDimensions } from 'react-native';
import { DraxDragWithReceiverEventData } from 'react-native-drax';
import PagerView from 'react-native-pager-view';
import { z } from 'zod';

import { useUpdateMealPlanItemDate } from '../../hooks/useUpdateMealPlanItemData';
import { useUpdateMealPlanRecipe } from '../../hooks/useUpdateMealPlanRecipe';

import { MealPlanDateSelectorDate } from './meal-plan-date-selector-date';

type MealPlanDateSelectorProps = {
  dates: Date[];
  currentDate: Date;
  onDatePress: (date: Date) => void;
  isProgrammaticNavigationRef: MutableRefObject<boolean>;
  datesWithMeals: Set<string>;
  datesAllMealsAdded: Set<string>;
};

// Generate weeks from a range of -30 to +30 weeks
const WEEK_RANGE = 30;

type WeekDate = {
  date: Date;
  dateKey: string;
  dayLabel: string;
  weekdayLabel: string;
  isDateToday: boolean;
};

const buildWeek = (weekStart: Date): WeekDate[] =>
  Array.from({ length: 7 }, (_, offset) => {
    const date = addDays(weekStart, offset);
    return {
      date,
      dateKey: format(date, 'yyyy-MM-dd'),
      dayLabel: format(date, 'd'),
      weekdayLabel: format(date, 'EE'),
      isDateToday: isToday(date),
    };
  });

const dragPayloadSchema = z.union([
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('recipe'),
      id: z.string(),
    }),
    z.object({
      type: z.literal('item'),
      id: z.string(),
    }),
  ]),
  z.object({
    recipeId: z.string(),
  }),
  z.object({
    itemId: z.string(),
  }),
]);

const MealPlanDateSelector = ({
  dates,
  currentDate,
  onDatePress,
  isProgrammaticNavigationRef,
  datesWithMeals,
  datesAllMealsAdded,
}: MealPlanDateSelectorProps) => {
  const pagerRef = useRef<PagerView>(null);
  const { width } = useWindowDimensions();
  const { mutate: updateMealPlanRecipe } = useUpdateMealPlanRecipe();
  const { mutate: updateMealPlanItemDate } = useUpdateMealPlanItemDate();
  const syncPagerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollIdleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Prefer the parent-provided date range to keep mount work small.
  const weeks = useMemo(() => {
    const allWeeks: WeekDate[][] = [];

    if (dates.length > 0) {
      const seen = new Set<string>();
      const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());

      for (const date of sortedDates) {
        const weekStart = startOfWeek(date, { weekStartsOn: 0 });
        const weekKey = format(weekStart, 'yyyy-MM-dd');
        if (seen.has(weekKey)) continue;
        seen.add(weekKey);
        allWeeks.push(buildWeek(weekStart));
      }

      return allWeeks;
    }

    const today = new Date();
    for (let i = -WEEK_RANGE; i <= WEEK_RANGE; i++) {
      const targetDate = i === 0 ? today : addWeeks(today, i);
      allWeeks.push(buildWeek(startOfWeek(targetDate, { weekStartsOn: 0 })));
    }

    return allWeeks;
  }, [dates]);

  const initialWeekIndex = useMemo(() => {
    const index = weeks.findIndex(week =>
      week.some(({ date }) => isSameDay(date, currentDate))
    );
    if (index !== -1) return index;
    return dates.length > 0 ? 0 : WEEK_RANGE;
  }, [currentDate, dates.length, weeks]);

  const [currentWeekIndex, setCurrentWeekIndex] = useState(initialWeekIndex);
  const isScrollingRef = useRef(false);
  const scrollStartWeekIndexRef = useRef(initialWeekIndex);
  const isAutoScrollingRef = useRef(false);

  // When currentDate changes, update the week page if needed
  useEffect(() => {
    if (isScrollingRef.current) return; // Don't auto-scroll while user is scrolling

    const targetWeekIndex = weeks.findIndex(week =>
      week.some(({ date }) => isSameDay(date, currentDate))
    );
    if (targetWeekIndex !== -1 && targetWeekIndex !== currentWeekIndex) {
      isAutoScrollingRef.current = true;
      pagerRef.current?.setPage(targetWeekIndex);
      setCurrentWeekIndex(targetWeekIndex);
      // Note: Don't reset isAutoScrollingRef here - let handlePageSelected do it
    } else if (targetWeekIndex === currentWeekIndex) {
      // Week doesn't need to change, but we still need to reset the programmatic flag
      // since handlePageSelected won't fire
      isProgrammaticNavigationRef.current = false;
    }
  }, [currentDate, currentWeekIndex, weeks, isProgrammaticNavigationRef]);

  // Keep pager position in sync if the source date range changes.
  useEffect(() => {
    setCurrentWeekIndex(initialWeekIndex);
    scrollStartWeekIndexRef.current = initialWeekIndex;
    if (syncPagerTimeoutRef.current) {
      clearTimeout(syncPagerTimeoutRef.current);
    }
    syncPagerTimeoutRef.current = setTimeout(() => {
      pagerRef.current?.setPageWithoutAnimation(initialWeekIndex);
    }, 0);
    return () => {
      if (syncPagerTimeoutRef.current) {
        clearTimeout(syncPagerTimeoutRef.current);
        syncPagerTimeoutRef.current = null;
      }
    };
  }, [initialWeekIndex]);

  useEffect(
    () => () => {
      if (scrollIdleTimeoutRef.current) {
        clearTimeout(scrollIdleTimeoutRef.current);
        scrollIdleTimeoutRef.current = null;
      }
    },
    []
  );

  const handlePageScrollStateChanged = (e: {
    nativeEvent: { pageScrollState: 'idle' | 'dragging' | 'settling' };
  }) => {
    const state = e.nativeEvent.pageScrollState;
    if (state === 'dragging') {
      if (scrollIdleTimeoutRef.current) {
        clearTimeout(scrollIdleTimeoutRef.current);
        scrollIdleTimeoutRef.current = null;
      }
      isScrollingRef.current = true;
      scrollStartWeekIndexRef.current = currentWeekIndex;
    } else if (state === 'idle') {
      if (scrollIdleTimeoutRef.current) {
        clearTimeout(scrollIdleTimeoutRef.current);
      }
      scrollIdleTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        scrollIdleTimeoutRef.current = null;
      }, 100);
    }
  };

  const handlePageSelected = (e: { nativeEvent: { position: number } }) => {
    const newIndex = e.nativeEvent.position;
    setCurrentWeekIndex(newIndex);

    // Capture flag states before resetting
    const wasAutoScrolling = isAutoScrollingRef.current;
    const wasProgrammatic = isProgrammaticNavigationRef.current;

    // When user finishes swiping to a new week (not auto-scroll or programmatic navigation),
    // select the first day of that week
    if (
      !wasAutoScrolling &&
      !wasProgrammatic &&
      newIndex !== scrollStartWeekIndexRef.current &&
      weeks[newIndex]
    ) {
      const firstDayOfWeek = weeks[newIndex][0]?.date; // Sunday is the first day
      if (!firstDayOfWeek) return;
      onDatePress(firstDayOfWeek);
    }

    // Update scrollStartWeekIndexRef to the new settled position
    // This ensures the next scroll has the correct baseline
    scrollStartWeekIndexRef.current = newIndex;

    // Reset flags after handling
    isAutoScrollingRef.current = false;
    isProgrammaticNavigationRef.current = false;
  };

  const handleReceiveDragDrop = useCallback(
    (date: Date, event: DraxDragWithReceiverEventData) => {
      const droppedDate = format(date, 'yyyy-MM-dd');
      const payload = dragPayloadSchema.parse(event.dragged?.payload);

      if ('recipeId' in payload) {
        updateMealPlanRecipe({
          mealPlanRecipeId: payload.recipeId,
          updates: {
            date: droppedDate,
          },
        });
        return;
      }

      if ('itemId' in payload) {
        updateMealPlanItemDate({
          mealPlanItemId: payload.itemId,
          date: droppedDate,
        });
        return;
      }

      if (payload.type === 'recipe') {
        updateMealPlanRecipe({
          mealPlanRecipeId: payload.id,
          updates: {
            date: droppedDate,
          },
        });
        return;
      }

      updateMealPlanItemDate({
        mealPlanItemId: payload.id,
        date: droppedDate,
      });
    },
    [updateMealPlanItemDate, updateMealPlanRecipe]
  );

  const dateWidth = (width - 32 - 4 * 6) / 7; // Account for px-4 and gap-1 (16px each side = 32px total)

  return (
    <PagerView
      ref={pagerRef}
      style={{ height: 100, flexShrink: 0, flexGrow: 0 }}
      initialPage={initialWeekIndex}
      onPageSelected={handlePageSelected}
      onPageScrollStateChanged={handlePageScrollStateChanged}
    >
      {weeks.map((weekDates, weekIndex) => (
        <View
          key={weekDates[0]?.dateKey ?? `week-${weekIndex}`}
          className="flex-row items-center justify-between gap-1 px-4"
        >
          {Math.abs(weekIndex - currentWeekIndex) <= 1
            ? weekDates.map(
                ({ date, dateKey, dayLabel, weekdayLabel, isDateToday }) => (
                  <MealPlanDateSelectorDate
                    key={dateKey}
                    date={date}
                    dateKey={dateKey}
                    dayLabel={dayLabel}
                    weekdayLabel={weekdayLabel}
                    isDateToday={isDateToday}
                    isSelected={isSameDay(date, currentDate)}
                    hasMeals={datesWithMeals.has(dateKey)}
                    allMealsAdded={datesAllMealsAdded.has(dateKey)}
                    onPress={onDatePress}
                    onReceiveDragDrop={handleReceiveDragDrop}
                    width={dateWidth}
                    isDropEnabled={weekIndex === currentWeekIndex}
                  />
                )
              )
            : null}
        </View>
      ))}
    </PagerView>
  );
};

export default MealPlanDateSelector;
