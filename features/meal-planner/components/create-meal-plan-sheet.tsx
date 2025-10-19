import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { addDays, format, startOfDay } from 'date-fns';
import { router } from 'expo-router';
import { CalendarIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { BottomSheet } from '../../../components/bottom-sheet';
import {
  CalendarSheet,
  CalendarSheetRef,
} from '../../../components/calendar-sheet';
import { Pill } from '../../../components/ui/pill';
import { useCreateMealPlan } from '../hooks';

export const CreateMealPlanSheet = () => {
  const createMealPlan = useCreateMealPlan();
  const bottomSheetRef = useRef<BottomSheetModal | null>(null);
  const [mealPlanName, setMealPlanName] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(
    startOfDay(new Date())
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    addDays(startOfDay(new Date()), 7)
  );
  const startDateSheetRef = useRef<CalendarSheetRef | null>(null);
  const endDateSheetRef = useRef<CalendarSheetRef | null>(null);

  const theme = useTheme();

  const getDefaultName = (date: Date) => {
    return `Week of ${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}`;
  };

  const onClose = () => {
    setStartDate(startOfDay(new Date()));
    setEndDate(addDays(startOfDay(new Date()), 7));
    setMealPlanName('');
  };

  const handleCreateMealPlan = async () => {
    if (!startDate || !endDate) {
      return;
    }

    const startDateStr = format(startDate, 'yyyy-MM-dd') + 'T00:00:00';
    const endDateStr = format(endDate, 'yyyy-MM-dd') + 'T00:00:00';

    // Create the meal plan without a grocery list
    const mealPlan = await createMealPlan.mutateAsync({
      mealPlan: {
        name: mealPlanName || getDefaultName(startDate),
        startDate: startDateStr,
        endDate: endDateStr,
      },
    });
    bottomSheetRef.current?.close();
    router.push(`/meal-plan/${mealPlan.id}`);
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
      {/** Start Date Sheet */}
      <CalendarSheet
        ref={startDateSheetRef}
        selectedDate={startDate}
        onChange={date => setStartDate(startOfDay(date))}
        onClose={() => {
          bottomSheetRef.current?.present();
        }}
      />
      {/** End Date Sheet */}
      <CalendarSheet
        ref={endDateSheetRef}
        selectedDate={endDate}
        onChange={date => setEndDate(startOfDay(date))}
        headerTitle="Select End Date"
        onClose={() => {
          bottomSheetRef.current?.present();
        }}
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
            <Pressable onPress={() => startDateSheetRef.current?.present()}>
              <Pill
                icon={<CalendarIcon color={theme.primary} size={16} />}
                hasValue={!!startDate}
              >
                {startDate
                  ? format(startDate, 'EEEE, M/d/yy')
                  : 'Select Start Date'}
              </Pill>
            </Pressable>
            <Pressable onPress={() => endDateSheetRef.current?.present()}>
              <Pill
                icon={<CalendarIcon color={theme.primary} size={16} />}
                hasValue={!!endDate}
              >
                {endDate ? format(endDate, 'EEEE, M/d/yy') : 'Select End Date'}
              </Pill>
            </Pressable>
          </View>

          <Button onPress={handleCreateMealPlan}>
            <Text>Create Meal Plan</Text>
          </Button>
        </View>
      </BottomSheet>
    </>
  );
};
