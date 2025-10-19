import { cn } from '@/lib/utils';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { Check, X } from 'lucide-react-native';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import { useTheme } from '../hooks/use-theme';
import { BottomSheet } from './bottom-sheet';
import { Button } from './ui/button';
import { Text } from './ui/text';

type CalendarSheetProps = {
  onChange: (date: Date) => void;
  onClose?: () => void;
  headerTitle?: string;
};

export type CalendarSheetRef = {
  present: (options?: {}) => void;
  dismiss: () => void;
  setSelectedDate: (date: Date) => void;
};

export const CalendarSheet = forwardRef<CalendarSheetRef, CalendarSheetProps>(
  ({ onChange, onClose: onCloseProp, headerTitle = 'Select Date' }, ref) => {
    const theme = useTheme();
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    // State for dynamic valid dates
    const [dynamicValidStartDate, setDynamicValidStartDate] = useState<
      Date | undefined
    >(undefined);
    const [dynamicValidEndDate, setDynamicValidEndDate] = useState<
      Date | undefined
    >(undefined);

    useImperativeHandle(ref, () => ({
      present: (options?: {
        selectedDate?: Date;
        validStartDate?: Date;
        validEndDate?: Date;
      }) => {
        console.log('present', options);
        reset();
        if (options?.selectedDate) {
          console.log('selectedDate', options.selectedDate);
          setInternalSelectedDate(startOfDay(options.selectedDate));
        }
        if (options?.validStartDate) {
          console.log('Setting validStartDate:', options.validStartDate);
          setDynamicValidStartDate(startOfDay(options.validStartDate));
        }
        if (options?.validEndDate) {
          console.log('Setting validEndDate:', options.validEndDate);
          setDynamicValidEndDate(startOfDay(options.validEndDate));
        }
        bottomSheetRef.current?.present();
      },
      dismiss: () => bottomSheetRef.current?.dismiss(),
      setSelectedDate: (date: Date) => {
        setInternalSelectedDate(startOfDay(date));
      },
    }));

    const currentDate = new Date();

    // Calculate months based on valid date range
    const getMonthsInRange = () => {
      // Always start from current month (never show previous months)
      const currentMonth = startOfMonth(new Date());

      if (!dynamicValidStartDate && !dynamicValidEndDate) {
        // Default behavior - show current month and next 2 months
        return [
          currentMonth,
          addMonths(currentMonth, 1),
          addMonths(currentMonth, 2),
        ];
      }

      // Determine the range based on valid dates
      let startMonth: Date;
      let endMonth: Date;

      if (dynamicValidStartDate && dynamicValidEndDate) {
        // Both dates provided - use them but ensure we don't go before current month
        startMonth = startOfMonth(
          Math.max(dynamicValidStartDate.getTime(), currentMonth.getTime())
        );
        endMonth = startOfMonth(dynamicValidEndDate);
      } else if (dynamicValidStartDate) {
        // Only start date - show from start date (or current month) to 2 months ahead
        startMonth = startOfMonth(
          Math.max(dynamicValidStartDate.getTime(), currentMonth.getTime())
        );
        endMonth = addMonths(startMonth, 2);
      } else if (dynamicValidEndDate) {
        // Only end date - show from current month to end date
        startMonth = currentMonth;
        endMonth = startOfMonth(dynamicValidEndDate);
      } else {
        // Fallback - show current month and next 2 months
        startMonth = currentMonth;
        endMonth = addMonths(currentMonth, 2);
      }

      const months = [];
      let month = startMonth;
      while (month <= endMonth) {
        months.push(new Date(month));
        month = addMonths(month, 1);
      }

      return months;
    };

    const months = getMonthsInRange();

    // Internal state to track the currently selected date
    // Normalize the selectedDate to start of day to avoid timezone issues
    const [internalSelectedDate, setInternalSelectedDate] = useState<
      Date | undefined
    >(undefined);

    const handleDatePress = (date: Date) => {
      // Check if date is within valid range
      const normalizedDate = startOfDay(date);
      const today = startOfDay(new Date());

      // Always prevent selection of dates before today
      if (normalizedDate < today) {
        return; // Don't allow selection before today
      }

      // Check if date is before valid start date
      if (dynamicValidStartDate && normalizedDate < dynamicValidStartDate) {
        return; // Don't allow selection before valid start date
      }

      // Check if date is after valid end date
      if (dynamicValidEndDate && normalizedDate > dynamicValidEndDate) {
        return; // Don't allow selection after valid end date
      }

      // Only update internal state, don't call onChange yet
      // Normalize to start of day to avoid timezone issues
      setInternalSelectedDate(normalizedDate);
    };

    const handleConfirm = () => {
      if (internalSelectedDate) {
        // Only call onChange when checkmark is pressed
        // Return the normalized date
        onChange(internalSelectedDate);
        bottomSheetRef.current?.dismiss();
      }
    };

    const handleClose = () => {
      bottomSheetRef.current?.dismiss();
    };

    const reset = () => {
      setInternalSelectedDate(undefined);
    };

    const onClose = () => {
      reset();
      onCloseProp?.();
    };

    const renderMonth = (month: Date) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Start week on Sunday
      const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

      const days = eachDayOfInterval({ start: startDate, end: endDate });

      // Group days into weeks and filter out weeks with no selectable days
      const weeks = [];
      for (let i = 0; i < days.length; i += 7) {
        const week = days.slice(i, i + 7);
        const hasSelectableDay = week.some(day => {
          const isCurrentMonth = day.getMonth() === month.getMonth();
          const normalizedDay = startOfDay(day);
          const today = startOfDay(new Date());
          const isBeforeToday = normalizedDay < today;
          const isBeforeValidStart =
            dynamicValidStartDate && normalizedDay < dynamicValidStartDate;
          const isAfterValidEnd =
            dynamicValidEndDate && normalizedDay > dynamicValidEndDate;
          const isWithinValidRange =
            !isBeforeToday && !isBeforeValidStart && !isAfterValidEnd;
          const isDisabled = !isWithinValidRange || !isCurrentMonth;

          return !isDisabled;
        });

        if (hasSelectableDay) {
          weeks.push(week);
        }
      }

      return (
        <View key={month.toISOString()} className="mb-6">
          <Text className="mb-4 text-center text-lg font-semibold text-foreground">
            {format(month, 'MMMM yyyy')}
          </Text>

          {/* Day headers */}
          <View className="mb-2 flex-row">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <View key={day} className="flex-1 items-center py-2">
                <Text className="text-xs font-medium text-muted-foreground">
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar grid - only render weeks with selectable days */}
          <View className="flex-col">
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} className="flex-row">
                {week.map(day => {
                  const isCurrentMonth = day.getMonth() === month.getMonth();
                  const normalizedDay = startOfDay(day);
                  const isSelected =
                    internalSelectedDate &&
                    isSameDay(normalizedDay, internalSelectedDate) &&
                    isCurrentMonth;
                  const isToday =
                    isSameDay(normalizedDay, startOfDay(currentDate)) &&
                    isCurrentMonth;

                  // Check if date is within valid range
                  const today = startOfDay(new Date());
                  const isBeforeToday = normalizedDay < today;
                  const isBeforeValidStart =
                    dynamicValidStartDate &&
                    normalizedDay < dynamicValidStartDate;
                  const isAfterValidEnd =
                    dynamicValidEndDate && normalizedDay > dynamicValidEndDate;
                  const isWithinValidRange =
                    !isBeforeToday && !isBeforeValidStart && !isAfterValidEnd;
                  const isDisabled = !isWithinValidRange || !isCurrentMonth;

                  return (
                    <Pressable
                      key={day.toISOString()}
                      onPress={() => handleDatePress(day)}
                      disabled={isDisabled}
                      className={cn(
                        'h-10 w-[14.28%] items-center justify-center',
                        !isCurrentMonth && 'opacity-30',
                        isDisabled && 'opacity-30',
                        !isDisabled && 'active:bg-accent/50'
                      )}
                    >
                      <View
                        className={cn(
                          'h-8 w-8 items-center justify-center rounded-full',
                          isSelected && 'bg-primary',
                          isDisabled && 'opacity-50'
                        )}
                      >
                        <Text
                          className={cn(
                            'text-sm font-medium',
                            isSelected && 'text-primary-foreground',
                            isToday && !isSelected && 'font-bold text-blue-800',
                            !isCurrentMonth && 'text-muted-foreground',
                            isDisabled && 'text-muted-foreground',
                            isCurrentMonth &&
                              !isSelected &&
                              !isToday &&
                              !isDisabled &&
                              'text-foreground'
                          )}
                        >
                          {format(day, 'd')}
                        </Text>
                      </View>
                    </Pressable>
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
        onOpen={() => KeyboardController.dismiss()}
        ignoreSafeArea
        onStartClose={onClose}
        ref={bottomSheetRef}
      >
        <View className="gap-4">
          {/* Custom header with close and confirm buttons */}
          <View className="flex-row items-center justify-between">
            <Button variant="ghost" size="icon" onPress={handleClose}>
              <X color={theme.primary} size={28} />
            </Button>

            <Text className="text-2xl font-bold text-foreground">
              {headerTitle}
            </Text>

            <Button
              variant="ghost"
              size="icon"
              onPress={handleConfirm}
              disabled={!internalSelectedDate}
            >
              <Check
                size={28}
                color={theme.primary}
                className={cn(
                  'text-foreground',
                  !internalSelectedDate && 'opacity-50'
                )}
              />
            </Button>
          </View>
          <View className="-mx-4 flex-row items-center justify-center ">
            <Text
              className={cn(
                'grow-0 self-center rounded-full bg-primary px-4 py-0.5 text-lg font-semibold text-primary-foreground '
              )}
            >
              {internalSelectedDate
                ? format(internalSelectedDate, 'EEEE, M/d/yy')
                : 'No date selected'}
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            className="max-h-96"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {months.map(renderMonth)}
          </ScrollView>
        </View>
      </BottomSheet>
    );
  }
);
