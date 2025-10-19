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
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { BottomSheet } from './bottom-sheet';
import { Button } from './ui/button';
import { Text } from './ui/text';

type CalendarSheetProps = {
  onChange: (date: Date) => void;
  selectedDate?: Date;
  ref: React.RefObject<BottomSheetModal | null>;
};

export const CalendarSheet = ({
  onChange,
  selectedDate,
  ref,
}: CalendarSheetProps) => {
  useEffect(() => {
    if (selectedDate) {
      setInternalSelectedDate(startOfDay(selectedDate));
    }
  }, [selectedDate]);
  const currentDate = new Date();
  const months = [
    addMonths(currentDate, -1), // Previous month
    currentDate, // Current month
    addMonths(currentDate, 1), // Next month
  ];

  // Internal state to track the currently selected date
  // Normalize the selectedDate to start of day to avoid timezone issues
  const [internalSelectedDate, setInternalSelectedDate] = useState<
    Date | undefined
  >(selectedDate ? startOfDay(selectedDate) : undefined);

  const handleDatePress = (date: Date) => {
    // Only update internal state, don't call onChange yet
    // Normalize to start of day to avoid timezone issues
    setInternalSelectedDate(startOfDay(date));
  };

  const handleConfirm = () => {
    if (internalSelectedDate) {
      // Only call onChange when checkmark is pressed
      // Return the normalized date
      onChange(internalSelectedDate);
      ref.current?.dismiss();
    }
  };

  const handleClose = () => {
    ref.current?.dismiss();
  };

  const onClose = () => {
    setInternalSelectedDate(undefined);
  };

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

            return (
              <Pressable
                key={day.toISOString()}
                onPress={() => handleDatePress(day)}
                className={cn(
                  'h-10 w-[14.28%] items-center justify-center',
                  !isCurrentMonth && 'opacity-30',
                  'active:bg-accent/50'
                )}
              >
                <View
                  className={cn(
                    'h-8 w-8 items-center justify-center rounded-full',
                    isToday && !isSelected && 'bg-orange-300',
                    isSelected && 'bg-primary'
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm font-medium',
                      isSelected && 'text-primary-foreground',
                      isToday && !isSelected && 'text-accent-foreground',
                      !isCurrentMonth && 'text-muted-foreground',
                      isCurrentMonth &&
                        !isSelected &&
                        !isToday &&
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
    <BottomSheet
      ignoreSafeArea
      onStartClose={onClose}
      ref={ref}
      snapPoints={['75%']}
    >
      <View className="gap-4">
        {/* Custom header with close and confirm buttons */}
        <View className="flex-row items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onPress={handleClose}
            className="h-10 w-10"
          >
            <X size={20} className="text-foreground" />
          </Button>

          <Text className="text-2xl font-bold text-foreground">
            Select Date
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
              className={cn(
                'text-foreground',
                !internalSelectedDate && 'opacity-50'
              )}
            />
          </Button>
        </View>

        <ScrollView
          ref={scrollViewRef =>
            scrollViewRef?.scrollTo({ y: 310, animated: false })
          }
          showsVerticalScrollIndicator={false}
          className="max-h-96"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {months.map(renderMonth)}
        </ScrollView>
      </View>
    </BottomSheet>
  );
};
