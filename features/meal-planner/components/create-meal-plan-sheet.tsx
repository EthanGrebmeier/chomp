import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { addDays, format, startOfDay } from 'date-fns';
import { CalendarIcon, RulerDimensionLine } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheet } from '../../../components/bottom-sheet';
import { CalendarSheet } from '../../../components/calendar-sheet';
import { Pill } from '../../../components/ui/pill';
import { useCreateMealPlan } from '../hooks';

export const CreateMealPlanSheet = () => {
  const createMealPlan = useCreateMealPlan();
  const bottomSheetRef = useRef<BottomSheetModal | null>(null);
  const [mealPlanName, setMealPlanName] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(
    startOfDay(new Date())
  );
  const [numberOfDays, setNumberOfDays] = useState(7);
  const calendarSheetRef = useRef<BottomSheetModal | null>(null);
  const getDefaultName = (date: Date) => {
    return `Week of ${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}`;
  };

  const onClose = () => {
    setStartDate(startOfDay(new Date()));
    setNumberOfDays(7);
    setMealPlanName('');
  };

  const handleCreateMealPlan = () => {
    if (!startDate) {
      return;
    }

    const endDate = addDays(startDate, numberOfDays - 1);
    const startDateStr = format(startDate, 'yyyy-MM-dd') + 'T00:00:00';
    const endDateStr = format(endDate, 'yyyy-MM-dd') + 'T00:00:00';

    // Create the meal plan without a grocery list
    createMealPlan.mutate({
      mealPlan: {
        name: mealPlanName || getDefaultName(startDate),
        startDate: startDateStr,
        endDate: endDateStr,
      },
    });
  };

  return (
    <>
      <Button
        onPress={() => bottomSheetRef.current?.present()}
        disabled={createMealPlan.isPending}
      >
        <Text>
          {createMealPlan.isPending ? 'Creating...' : 'Create Meal Plan'}
        </Text>
      </Button>
      <CalendarSheet
        ref={calendarSheetRef}
        selectedDate={startDate}
        onChange={date => setStartDate(startOfDay(date))}
      />
      <BottomSheet onStartClose={onClose} ref={bottomSheetRef}>
        <View className="gap-4">
          <BottomSheet.BareTextInput
            className="text-2xl font-semibold text-foreground"
            placeholder="Meal Plan Name"
            value={mealPlanName}
            onChangeText={setMealPlanName}
          />
          <View className=" flex-row items-center gap-2 border-t border-border pt-2">
            <Pressable onPress={() => calendarSheetRef.current?.present()}>
              <Pill
                icon={<CalendarIcon size={16} />}
                hasValue={!!startDate}
                onClear={() => setStartDate(undefined)}
              >
                {startDate
                  ? format(startDate, 'EEEE, M/d/yy')
                  : 'Select Start Date'}
              </Pill>
            </Pressable>
            <Pill
              icon={<RulerDimensionLine size={16} />}
              hasValue={!!numberOfDays}
              onClear={() => setNumberOfDays(7)}
            >
              {numberOfDays} Days
            </Pill>
          </View>

          <Button onPress={handleCreateMealPlan}>
            <Text>Create Meal Plan</Text>
          </Button>
        </View>
      </BottomSheet>
    </>
  );
};
