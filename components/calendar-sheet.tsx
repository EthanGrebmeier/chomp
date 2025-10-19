import { cn } from '@/lib/utils';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { Check, X } from 'lucide-react-native';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTheme } from '../hooks/use-theme';
import { BottomSheet } from './bottom-sheet';
import { Button } from './ui/button';
import { Text } from './ui/text';

type CalendarSheetProps = {
  onChange: (date: Date) => void;
  onClose?: () => void;
  selectedDate?: Date;
  headerTitle?: string;
  validStartDate?: Date;
  validEndDate?: Date;
};

export type CalendarSheetRef = {
  present: (options?: { selectedDate?: Date }) => void;
  dismiss: () => void;
  setSelectedDate: (date: Date) => void;
};

export const CalendarSheet = forwardRef<CalendarSheetRef, CalendarSheetProps>(
  (
    {
      onChange,
      onClose: onCloseProp,
      selectedDate,
      headerTitle = 'Select Date',
      validStartDate,
      validEndDate,
    },
    ref
  ) => {
    const theme = useTheme();
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(ref, () => ({
      present: (options?: { selectedDate?: Date }) => {
        if (options?.selectedDate) {
          setInternalSelectedDate(startOfDay(options.selectedDate));
        }
        bottomSheetRef.current?.present();
      },
      dismiss: () => bottomSheetRef.current?.dismiss(),
      setSelectedDate: (date: Date) => {
        setInternalSelectedDate(startOfDay(date));
      },
    }));

    useEffect(() => {
      if (selectedDate) {
        setInternalSelectedDate(startOfDay(selectedDate));
      }
    }, [selectedDate]);
    const currentDate = new Date();

    // Calculate months based on valid date range
    const getMonthsInRange = () => {
      if (!validStartDate || !validEndDate) {
        // Default behavior if no valid range provided
        return [
          addMonths(currentDate, -1), // Previous month
          currentDate, // Current month
          addMonths(currentDate, 1), // Next month
        ];
      }

      const startMonth = startOfMonth(validStartDate);
      const endMonth = startOfMonth(validEndDate);
      const months = [];

      let currentMonth = startMonth;
      while (currentMonth <= endMonth) {
        months.push(new Date(currentMonth));
        currentMonth = addMonths(currentMonth, 1);
      }

      return months;
    };

    const months = getMonthsInRange();

    // Internal state to track the currently selected date
    // Normalize the selectedDate to start of day to avoid timezone issues
    const [internalSelectedDate, setInternalSelectedDate] = useState<
      Date | undefined
    >(selectedDate ? startOfDay(selectedDate) : undefined);

    const handleDatePress = (date: Date) => {
      // Check if date is within valid range
      const normalizedDate = startOfDay(date);
      if (validStartDate && validEndDate) {
        if (
          !isWithinInterval(normalizedDate, {
            start: validStartDate,
            end: validEndDate,
          })
        ) {
          return; // Don't allow selection outside valid range
        }
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

    const handleScrollToCurrentMonth = useCallback((ref: ScrollView | null) => {
      ref?.scrollTo({ y: 310, animated: false });
    }, []);

    const renderMonth = (month: Date) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Start week on Sunday
      const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

      const days = eachDayOfInterval({ start: startDate, end: endDate });

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

          {/* Calendar grid */}
          <View className="flex-row flex-wrap">
            {days.map((day, index) => {
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
              const isWithinValidRange =
                !validStartDate ||
                !validEndDate ||
                isWithinInterval(normalizedDay, {
                  start: validStartDate,
                  end: validEndDate,
                });
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
        </View>
      );
    };

    return (
      <BottomSheet ignoreSafeArea onStartClose={onClose} ref={bottomSheetRef}>
        <View className="gap-4">
          {/* Custom header with close and confirm buttons */}
          <View className="flex-row items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onPress={handleClose}
              className="h-10 w-10"
            >
              <X color={theme.primary} size={20} />
            </Button>

            <Text className="text-2xl font-bold text-foreground">
              {headerTitle}
            </Text>

            <Button
              variant="ghost"
              size="icon"
              onPress={handleConfirm}
              disabled={!internalSelectedDate}
              className="h-10 w-10"
            >
              <Check
                size={20}
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
            ref={handleScrollToCurrentMonth}
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
