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

import { MealTimeDropdown } from './meal-time-dropdown';

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

  const spanClassName = (hasValue: boolean) =>
    cn(
      'underline',
      hasValue
        ? 'font-semibold text-foreground'
        : 'font-medium text-muted-foreground'
    );

  return (
    <View className={cn(disabled && 'opacity-50')}>
      <View className="flex-row flex-wrap items-center gap-x-1">
        <Text variant="body" className="text-muted-foreground">
          Planned for
        </Text>
        <MealTimeDropdown
          mealTime={mealTag}
          onSelect={onMealTagChange}
          disabled={disabled}
        >
          <Text className={spanClassName(!!mealTag)}>
            {mealTag ?? 'no meal time'}
          </Text>
        </MealTimeDropdown>
        <Text variant="body" className="text-muted-foreground">
          on
        </Text>
        <Text
          className={spanClassName(!!date)}
          onPress={
            disabled ? undefined : () => calendarSheetRef.current?.present()
          }
        >
          {date ? formatMealPlanDate(date) : 'a date'}
        </Text>
      </View>

      <CalendarSheet
        ref={calendarSheetRef}
        name="meal-schedule-calendar-sheet"
        headerTitle="Choose a date"
        selectedDate={date ? parseMealPlanDate(date) : undefined}
        onChange={selectedDate => {
          onDateChange(format(selectedDate, 'yyyy-MM-dd'));
        }}
      />
    </View>
  );
};
