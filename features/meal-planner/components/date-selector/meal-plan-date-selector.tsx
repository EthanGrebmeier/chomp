import { addWeeks, endOfWeek, isSameDay, startOfWeek } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import PagerView from 'react-native-pager-view';

import { MealPlanDateSelectorDate } from './meal-plan-date-selector-date';

type MealPlanDateSelectorProps = {
  dates: Date[];
  currentDate: Date;
  onDatePress: (date: Date) => void;
};

// Generate weeks from a range of -30 to +30 weeks
const WEEK_RANGE = 30;

const MealPlanDateSelector = ({
  currentDate,
  onDatePress,
}: MealPlanDateSelectorProps) => {
  const pagerRef = useRef<PagerView>(null);
  const { width } = useWindowDimensions();

  // Generate all weeks to display (30 weeks before and after today)
  const weeks = useMemo(() => {
    const today = new Date();
    const allWeeks: Date[][] = [];

    for (let i = -WEEK_RANGE; i <= WEEK_RANGE; i++) {
      const targetDate = i === 0 ? today : addWeeks(today, i);
      const weekStart = startOfWeek(targetDate, { weekStartsOn: 0 }); // 0 = Sunday
      const weekEnd = endOfWeek(targetDate, { weekStartsOn: 0 });

      const weekDates: Date[] = [];
      const current = new Date(weekStart);
      while (current <= weekEnd) {
        weekDates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      allWeeks.push(weekDates);
    }

    return allWeeks;
  }, []);

  // Initial week index is the current week (middle of the range)
  const initialWeekIndex = WEEK_RANGE;

  const [currentWeekIndex, setCurrentWeekIndex] = useState(initialWeekIndex);
  const isScrollingRef = useRef(false);
  const scrollStartWeekIndexRef = useRef(initialWeekIndex);
  const isAutoScrollingRef = useRef(false);

  // When currentDate changes, update the week page if needed
  useEffect(() => {
    if (isScrollingRef.current) return; // Don't auto-scroll while user is scrolling

    const targetWeekIndex = weeks.findIndex(week =>
      week.some(d => isSameDay(d, currentDate))
    );
    if (targetWeekIndex !== -1 && targetWeekIndex !== currentWeekIndex) {
      isAutoScrollingRef.current = true;
      pagerRef.current?.setPage(targetWeekIndex);
      setCurrentWeekIndex(targetWeekIndex);
      // Reset auto-scrolling flag after animation completes
      setTimeout(() => {
        isAutoScrollingRef.current = false;
      }, 300);
    }
  }, [currentDate, currentWeekIndex, weeks]);

  // Initialize scroll position to current week
  useEffect(() => {
    setTimeout(() => {
      pagerRef.current?.setPageWithoutAnimation(initialWeekIndex);
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageScrollStateChanged = (e: {
    nativeEvent: { pageScrollState: 'idle' | 'dragging' | 'settling' };
  }) => {
    const state = e.nativeEvent.pageScrollState;
    if (state === 'dragging') {
      isScrollingRef.current = true;
      scrollStartWeekIndexRef.current = currentWeekIndex;
    } else if (state === 'idle') {
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 100);
    }
  };

  const handlePageSelected = (e: { nativeEvent: { position: number } }) => {
    const newIndex = e.nativeEvent.position;
    setCurrentWeekIndex(newIndex);

    // When user finishes swiping to a new week (not auto-scroll), select the first day of that week
    if (
      !isAutoScrollingRef.current &&
      newIndex !== scrollStartWeekIndexRef.current &&
      weeks[newIndex]
    ) {
      const firstDayOfWeek = weeks[newIndex][0]; // Sunday is the first day
      onDatePress(firstDayOfWeek);
    }
  };
  const dateWidth = (width - 32 - 4 * 6) / 7; // Account for px-4 and gap-1 (16px each side = 32px total)

  return (
    <PagerView
      ref={pagerRef}
      style={{ height: 80, flexShrink: 0, flexGrow: 0 }}
      initialPage={initialWeekIndex}
      onPageSelected={handlePageSelected}
      onPageScrollStateChanged={handlePageScrollStateChanged}
    >
      {weeks.map((weekDates, weekIndex) => (
        <View
          key={weekIndex}
          className="flex-row items-center justify-between gap-1 px-4"
        >
          {weekDates.map(date => (
            <MealPlanDateSelectorDate
              key={date.toISOString()}
              date={date}
              isSelected={isSameDay(date, currentDate)}
              onPress={onDatePress}
              width={dateWidth}
            />
          ))}
        </View>
      ))}
    </PagerView>
  );
};

export default MealPlanDateSelector;
