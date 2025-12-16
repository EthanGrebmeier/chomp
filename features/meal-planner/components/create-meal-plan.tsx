import { addDays, format, startOfDay } from 'date-fns';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

import {
  CalendarSheet,
  CalendarSheetRef,
} from '../../../components/calendar-sheet';
import { useCreateMealPlan } from '../hooks';

export const CreateMealPlan = () => {
  const createMealPlan = useCreateMealPlan();
  const [startDate, setStartDate] = useState<Date | undefined>(
    startOfDay(new Date())
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    addDays(startOfDay(new Date()), 6)
  );
  const startDateSheetRef = useRef<CalendarSheetRef | null>(null);
  const endDateSheetRef = useRef<CalendarSheetRef | null>(null);

  const getDefaultName = (date: Date) => {
    return `Week of ${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}`;
  };

  const handleCreateMealPlan = async () => {
    if (!startDate || !endDate) {
      return;
    }

    const startDateStr = format(startDate, 'yyyy-MM-dd') + 'T00:00:00';
    const endDateStr = format(endDate, 'yyyy-MM-dd') + 'T00:00:00';

    // Create the meal plan without a grocery list
    await createMealPlan.mutateAsync({
      mealPlan: {
        name: getDefaultName(startDate),
        startDate: startDateStr,
        endDate: endDateStr,
      },
    });
  };

  return (
    <>
      <Button
        onPress={handleCreateMealPlan}
        disabled={createMealPlan.isPending}
        size="sm"
        variant="outline"
      >
        <Text className="leading-6">
          {createMealPlan.isPending ? 'Creating...' : 'Create Meal Plan'}
        </Text>
      </Button>
      {/** Start Date Sheet */}
      <CalendarSheet
        name="create-meal-plan-start-date-sheet"
        ref={startDateSheetRef}
        onChange={date => setStartDate(startOfDay(date))}
        headerTitle="Select Start Date"
        selectedDate={startDate}
        validEndDate={endDate}
      />
      {/** End Date Sheet */}
      <CalendarSheet
        name="create-meal-plan-end-date-sheet"
        ref={endDateSheetRef}
        onChange={date => setEndDate(startOfDay(date))}
        headerTitle="Select End Date"
        selectedDate={endDate}
        validStartDate={startDate}
      />
    </>
  );
};
