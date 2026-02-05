import { TrueSheet } from '@lodev09/react-native-true-sheet';
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
  subDays,
} from 'date-fns';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';

import { cn } from '@/lib/utils';

import { BottomSheet } from './bottom-sheet';
import { Button } from './ui/button';
import { CloseButton } from './ui/close-button';
import { HapticPressable } from './ui/haptic-pressable';
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

    useImperativeHandle(ref, () => ({
      present: () => {
        bottomSheetRef.current?.present();
      },
      dismiss: () => bottomSheetRef.current?.dismiss(),
    }));

    const currentDate = new Date();

    // Calculate months based on valid date range
    const getMonthsInRange = () => {
      const currentMonth = startOfMonth(new Date());
      const today = startOfDay(new Date());
      const oneWeekAgo = startOfDay(subDays(today, 7));
      const earliestAllowedMonth = startOfMonth(oneWeekAgo);

      if (!validStartDate && !validEndDate) {
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

      if (validStartDate && validEndDate) {
        // Both dates provided - use them but ensure we don't go before one week ago
        startMonth = startOfMonth(
          Math.max(validStartDate.getTime(), earliestAllowedMonth.getTime())
        );
        endMonth = startOfMonth(validEndDate);
      } else if (validStartDate) {
        // Only start date - show from start date (or earliest allowed) to 2 months ahead
        startMonth = startOfMonth(
          Math.max(validStartDate.getTime(), earliestAllowedMonth.getTime())
        );
        endMonth = addMonths(startMonth, 2);
      } else if (validEndDate) {
        // Only end date - show from earliest allowed to end date
        startMonth = earliestAllowedMonth;
        endMonth = startOfMonth(validEndDate);
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
    >(selectedDate);

    const handleDatePress = (date: Date) => {
      // Check if date is within valid range
      const normalizedDate = startOfDay(date);
      const today = startOfDay(new Date());
      const oneWeekAgo = startOfDay(subDays(today, 7));

      // Allow selection of dates up to a week before today
      if (normalizedDate < oneWeekAgo) {
        return; // Don't allow selection more than a week before today
      }

      // Check if date is before valid start date
      if (validStartDate && normalizedDate < validStartDate) {
        return; // Don't allow selection before valid start date
      }

      // Check if date is after valid end date
      if (validEndDate && normalizedDate > validEndDate) {
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
    const onClose = () => {
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
          const oneWeekAgo = startOfDay(subDays(today, 7));
          const isTooOld = normalizedDay < oneWeekAgo;
          const isBeforeValidStart =
            validStartDate && normalizedDay < validStartDate;
          const isAfterValidEnd = validEndDate && normalizedDay > validEndDate;
          const isWithinValidRange =
            !isTooOld && !isBeforeValidStart && !isAfterValidEnd;
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
                  const oneWeekAgo = startOfDay(subDays(today, 7));
                  const isTooOld = normalizedDay < oneWeekAgo;
                  const isBeforeValidStart =
                    validStartDate && normalizedDay < validStartDate;
                  const isAfterValidEnd =
                    validEndDate && normalizedDay > validEndDate;
                  const isWithinValidRange =
                    !isTooOld && !isBeforeValidStart && !isAfterValidEnd;
                  const isDisabled = !isWithinValidRange || !isCurrentMonth;

                  return (
                    <HapticPressable
                      key={day.toISOString()}
                      onPress={() => handleDatePress(day)}
                      disabled={isDisabled}
                      className={cn(
                        'h-10 w-[14.28%] items-center justify-center',
                        !isCurrentMonth && 'opacity-30',
                        isDisabled && 'opacity-30'
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
        name={name}
        onOpen={() => KeyboardController.dismiss()}
        onStartClose={onClose}
        ref={bottomSheetRef}
        insetAdjustment="never"
        footer={
          <View className="px-10 pb-4">
            <Button onPress={handleConfirm} disabled={!internalSelectedDate}>
              <Text>Confirm</Text>
            </Button>
          </View>
        }
      >
        <BottomSheet.SheetView className="pb-safe gap-4">
          <View className="flex-row items-center justify-between pb-2">
            <CloseButton onPress={handleClose} />
            <Text className="text-2xl font-bold">{headerTitle}</Text>
            <View className="w-10" />
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
        </BottomSheet.SheetView>
      </BottomSheet>
    );
  }
);

CalendarSheet.displayName = 'CalendarSheet';
