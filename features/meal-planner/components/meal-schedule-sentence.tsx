import { format } from 'date-fns';
import { useRef } from 'react';
import { View } from 'react-native';

import {
  CalendarSheet,
  CalendarSheetRef,
} from '../../../components/calendar-sheet';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import {
  formatMealPlanDate,
  parseMealPlanDate,
} from '../utils/meal-plan-date-format';

import { MealTimeSheet, MealTimeSheetRef } from './meal-time-sheet';

type MealScheduleSentenceProps = {
  date?: string;
  onDateChange: (date: string) => void;
  mealTag?: string;
  onMealTagChange: (mealTag?: string) => void;
  disabled?: boolean;
};

export const MealScheduleSentence = ({
  date,
  onDateChange,
  mealTag,
  onMealTagChange,
  disabled = false,
}: MealScheduleSentenceProps) => {
  const calendarSheetRef = useRef<CalendarSheetRef>(null);
  const mealTimeSheetRef = useRef<MealTimeSheetRef>(null);

  const spanClassName = (hasValue: boolean) =>
    cn(
      'underline',
      hasValue
        ? 'font-semibold text-foreground'
        : 'font-medium text-muted-foreground'
    );

  return (
    <View className={cn(disabled && 'opacity-50')}>
      <Text variant="body" className="text-muted-foreground">
        Planned for{' '}
        <Text
          className={spanClassName(!!mealTag)}
          onPress={
            disabled ? undefined : () => mealTimeSheetRef.current?.present()
          }
        >
          {mealTag ?? 'a meal time'}
        </Text>{' '}
        on{' '}
        <Text
          className={spanClassName(!!date)}
          onPress={
            disabled ? undefined : () => calendarSheetRef.current?.present()
          }
        >
          {date ? formatMealPlanDate(date) : 'a date'}
        </Text>
      </Text>

      <CalendarSheet
        ref={calendarSheetRef}
        name="meal-schedule-calendar-sheet"
        headerTitle="Choose a date"
        selectedDate={date ? parseMealPlanDate(date) : undefined}
        onChange={selectedDate => {
          onDateChange(format(selectedDate, 'yyyy-MM-dd'));
        }}
      />
      <MealTimeSheet
        ref={mealTimeSheetRef}
        hideTrigger
        mealTime={mealTag}
        onSelect={onMealTagChange}
        disabled={disabled}
      />
    </View>
  );
};
