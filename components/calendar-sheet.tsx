import { TrueSheet } from '@lodev09/react-native-true-sheet';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isSameWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react-native';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import PagerView from 'react-native-pager-view';

import { cn } from '@/lib/utils';

import { BottomSheet } from './bottom-sheet';
import { BackButton } from './ui/back-button';
import { Button } from './ui/button';
import { ConfirmButton } from './ui/confirm-button';
import { HapticPressable } from './ui/haptic-pressable';
import { Icon } from './ui/icon';
import { Text } from './ui/text';

type CalendarSheetProps = {
  onChange: (date: Date) => void;
  onClose?: () => void;
  headerTitle?: string;
  name?: string;
  validStartDate?: Date;
  validEndDate?: Date;
  selectedDate?: Date;
};

export type CalendarSheetRef = {
  present: () => void;
  dismiss: () => void;
};

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const CalendarSheet = forwardRef<CalendarSheetRef, CalendarSheetProps>(
  (
    {
      onChange,
      onClose: onCloseProp,
      headerTitle = 'Select Date',
      name,
      validStartDate,
      validEndDate,
      selectedDate,
    },
    ref
  ) => {
    const bottomSheetRef = useRef<TrueSheet>(null);
    const pagerRef = useRef<PagerView>(null);

    useImperativeHandle(ref, () => ({
      present: () => {
        bottomSheetRef.current?.present();
      },
      dismiss: () => bottomSheetRef.current?.dismiss(),
    }));

    const today = useMemo(() => startOfDay(new Date()), []);
    const tomorrow = useMemo(() => startOfDay(addDays(today, 1)), [today]);
    const oneWeekAgo = useMemo(() => startOfDay(subDays(today, 7)), [today]);
    const normalizedValidStartDate = validStartDate
      ? startOfDay(validStartDate)
      : undefined;
    const normalizedValidEndDate = validEndDate
      ? startOfDay(validEndDate)
      : undefined;

    const isDateSelectable = (date: Date) => {
      if (date < oneWeekAgo) {
        return false;
      }
      if (normalizedValidStartDate && date < normalizedValidStartDate) {
        return false;
      }
      if (normalizedValidEndDate && date > normalizedValidEndDate) {
        return false;
      }
      return true;
    };

    const months = useMemo(() => {
      const currentMonth = startOfMonth(today);
      const earliestAllowedMonth = startOfMonth(oneWeekAgo);

      if (!validStartDate && !validEndDate) {
        return [
          currentMonth,
          addMonths(currentMonth, 1),
          addMonths(currentMonth, 2),
        ];
      }

      let startMonth: Date;
      let endMonth: Date;

      if (validStartDate && validEndDate) {
        startMonth = startOfMonth(
          Math.max(validStartDate.getTime(), earliestAllowedMonth.getTime())
        );
        endMonth = startOfMonth(validEndDate);
      } else if (validStartDate) {
        startMonth = startOfMonth(
          Math.max(validStartDate.getTime(), earliestAllowedMonth.getTime())
        );
        endMonth = addMonths(startMonth, 2);
      } else if (validEndDate) {
        startMonth = earliestAllowedMonth;
        endMonth = startOfMonth(validEndDate);
      } else {
        startMonth = currentMonth;
        endMonth = addMonths(currentMonth, 2);
      }

      const monthsInRange: Date[] = [];
      let month = startMonth;
      while (month <= endMonth) {
        monthsInRange.push(new Date(month));
        month = addMonths(month, 1);
      }

      return monthsInRange;
    }, [oneWeekAgo, today, validEndDate, validStartDate]);

    const [internalSelectedDate, setInternalSelectedDate] = useState<
      Date | undefined
    >(selectedDate ? startOfDay(selectedDate) : undefined);

    useEffect(() => {
      setInternalSelectedDate(
        selectedDate ? startOfDay(selectedDate) : undefined
      );
    }, [selectedDate]);

    const getMonthIndexForDate = useCallback(
      (date: Date) => months.findIndex(month => isSameMonth(month, date)),
      [months]
    );

    const initialMonthIndex = useMemo(() => {
      if (months.length === 0) {
        return 0;
      }
      const anchorDate = internalSelectedDate ?? today;
      const index = getMonthIndexForDate(anchorDate);
      return index === -1 ? 0 : index;
    }, [getMonthIndexForDate, internalSelectedDate, months, today]);

    const [currentMonthIndex, setCurrentMonthIndex] =
      useState(initialMonthIndex);

    useEffect(() => {
      setCurrentMonthIndex(initialMonthIndex);
      requestAnimationFrame(() => {
        pagerRef.current?.setPageWithoutAnimation(initialMonthIndex);
      });
    }, [initialMonthIndex]);

    const setMonthPage = (monthIndex: number, animated = true) => {
      if (monthIndex < 0 || monthIndex >= months.length) {
        return;
      }

      setCurrentMonthIndex(monthIndex);
      if (animated) {
        pagerRef.current?.setPage(monthIndex);
      } else {
        pagerRef.current?.setPageWithoutAnimation(monthIndex);
      }
    };

    const handleDatePress = (date: Date) => {
      const normalizedDate = startOfDay(date);
      if (!isDateSelectable(normalizedDate)) {
        return;
      }

      setInternalSelectedDate(normalizedDate);
      const targetMonthIndex = getMonthIndexForDate(normalizedDate);
      if (targetMonthIndex !== -1 && targetMonthIndex !== currentMonthIndex) {
        setMonthPage(targetMonthIndex);
      }
    };

    const handleShortcutPress = (date: Date) => {
      const normalizedDate = startOfDay(date);
      if (!isDateSelectable(normalizedDate)) {
        return;
      }

      setInternalSelectedDate(normalizedDate);
      const targetMonthIndex = getMonthIndexForDate(normalizedDate);
      if (targetMonthIndex !== -1) {
        setMonthPage(targetMonthIndex);
      }
    };

    const handleConfirm = () => {
      if (internalSelectedDate) {
        onChange(internalSelectedDate);
        bottomSheetRef.current?.dismiss();
      }
    };

    const handleClose = () => {
      bottomSheetRef.current?.dismiss();
    };

    const onClose = () => {
      onCloseProp?.();
    };

    const handlePageSelected = (event: {
      nativeEvent: { position: number };
    }) => {
      setCurrentMonthIndex(event.nativeEvent.position);
    };

    const currentMonth = months[currentMonthIndex];
    const canGoToPreviousMonth = currentMonthIndex > 0;
    const canGoToNextMonth = currentMonthIndex < months.length - 1;
    const calendarPagerHeight = 312;

    const renderMonth = (month: Date) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
      const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
      const days = eachDayOfInterval({ start: startDate, end: endDate });

      const weeks: Date[][] = [];
      for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
      }

      return (
        <View key={month.toISOString()} className="flex-1">
          <View className="flex-col gap-1">
            {weeks.map((week, weekIndex) => (
              <View
                key={weekIndex}
                className={cn(
                  'flex-row rounded-lg',
                  week.some(day => isSameWeek(day, today, { weekStartsOn: 0 }))
                    ? 'bg-muted/35'
                    : null
                )}
              >
                {week.map(day => {
                  const normalizedDay = startOfDay(day);
                  const isCurrentMonth = isSameMonth(normalizedDay, month);
                  const isSelected = internalSelectedDate
                    ? isSameDay(normalizedDay, internalSelectedDate)
                    : false;
                  const isToday = isSameDay(normalizedDay, today);
                  const isDisabled = !isDateSelectable(normalizedDay);

                  return (
                    <HapticPressable
                      key={day.toISOString()}
                      onPress={() => handleDatePress(day)}
                      disabled={isDisabled}
                      className={cn(
                        'h-12 flex-1 items-center justify-center',
                        isDisabled ? 'opacity-40' : null
                      )}
                    >
                      <View
                        className={cn(
                          'h-8 w-8 items-center justify-center rounded-full',
                          isSelected ? 'bg-primary' : null
                        )}
                      >
                        <Text
                          className={cn(
                            'text-sm font-medium',
                            isSelected ? 'text-primary-foreground' : null,
                            !isSelected && !isCurrentMonth
                              ? 'text-muted-foreground'
                              : null,
                            !isSelected && isCurrentMonth && isToday
                              ? 'font-semibold text-blue-800'
                              : null,
                            !isSelected &&
                              !isToday &&
                              !isDisabled &&
                              isCurrentMonth
                              ? 'text-foreground'
                              : null,
                            !isSelected && isDisabled
                              ? 'text-muted-foreground'
                              : null
                          )}
                        >
                          {format(day, 'd')}
                        </Text>
                      </View>
                    </HapticPressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      );
    };

    return (
      <BottomSheet
        detents={['auto']}
        name={name}
        onOpen={() => KeyboardController.dismiss()}
        onDismiss={onClose}
        ref={bottomSheetRef}
        insetAdjustment="never"
      >
        <BottomSheet.SheetView className="pb-safe gap-4">
          <BottomSheet.Header
            className="mb-0"
            title={headerTitle}
            dismissButton={<BackButton onPress={handleClose} />}
            button={
              <ConfirmButton
                onPress={handleConfirm}
                disabled={!internalSelectedDate}
              />
            }
          />

          <View className="-mx-4 gap-2 border-b border-border px-4 pb-4">
            <HapticPressable
              className="flex-row items-center justify-between"
              onPress={() => handleShortcutPress(today)}
            >
              <Text
                className={cn(
                  'text-base font-medium',
                  internalSelectedDate && isSameDay(internalSelectedDate, today)
                    ? 'font-semibold text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                Today
              </Text>
              <Text className="text-sm text-muted-foreground">
                {format(today, 'MMM d')}
              </Text>
            </HapticPressable>
            <HapticPressable onPress={() => handleShortcutPress(tomorrow)}>
              <Text
                className={cn(
                  'text-base font-medium',
                  internalSelectedDate &&
                    isSameDay(internalSelectedDate, tomorrow)
                    ? 'font-semibold text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                Tomorrow
              </Text>
            </HapticPressable>
          </View>

          <View>
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-semibold text-foreground">
                {currentMonth ? format(currentMonth, 'MMM yyyy') : ''}
              </Text>
              <View className="flex-row items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={!canGoToPreviousMonth}
                  onPress={() => setMonthPage(currentMonthIndex - 1)}
                >
                  <Icon as={ChevronLeftIcon} size={18} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={!canGoToNextMonth}
                  onPress={() => setMonthPage(currentMonthIndex + 1)}
                >
                  <Icon as={ChevronRightIcon} size={18} />
                </Button>
              </View>
            </View>

            <View className="mb-2 flex-row">
              {DAY_HEADERS.map(day => (
                <View key={day} className="flex-1 items-center py-1">
                  <Text className="text-xs font-medium text-muted-foreground">
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            <PagerView
              ref={pagerRef}
              style={{ height: calendarPagerHeight }}
              initialPage={initialMonthIndex}
              onPageSelected={handlePageSelected}
            >
              {months.map(renderMonth)}
            </PagerView>
          </View>
        </BottomSheet.SheetView>
      </BottomSheet>
    );
  }
);

CalendarSheet.displayName = 'CalendarSheet';
