import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { addDays, format, startOfDay } from 'date-fns';
import { SunriseIcon, SunsetIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { KeyboardController } from 'react-native-keyboard-controller';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

import { BottomSheet } from '../../../components/bottom-sheet';
import {
  CalendarSheet,
  CalendarSheetRef,
} from '../../../components/calendar-sheet';
import { Icon } from '../../../components/ui/icon';
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

  const onClose = () => {
    setStartDate(startOfDay(new Date()));
    setEndDate(addDays(startOfDay(new Date()), 7));
    setMealPlanName('');
    KeyboardController.dismiss();
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
        name: mealPlanName || getDefaultName(startDate),
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
      >
        <Text>
          {createMealPlan.isPending ? 'Creating...' : 'Create Meal Plan'}
        </Text>
      </Button>
      {/** Start Date Sheet */}
      <CalendarSheet
        ref={startDateSheetRef}
        onChange={date => setStartDate(startOfDay(date))}
        headerTitle="Select Start Date"
      />
      {/** End Date Sheet */}
      <CalendarSheet
        ref={endDateSheetRef}
        onChange={date => setEndDate(startOfDay(date))}
        headerTitle="Select End Date"
      />
      <BottomSheet onStartClose={onClose} ref={bottomSheetRef}>
        <View className="gap-4">
          <BottomSheet.BareTextInput
            className="text-2xl font-semibold text-foreground"
            placeholder="Meal Plan Name"
            value={mealPlanName}
            onChangeText={setMealPlanName}
          />
          <ScrollView
            horizontal
            className="-mx-4"
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-4 flex-row items-center gap-2 pt-2 "
          >
            <Pressable
              onPress={() =>
                startDateSheetRef.current?.present({
                  selectedDate: startDate,
                  validEndDate: endDate,
                })
              }
            >
              <Pill
                icon={<Icon as={SunriseIcon} size={16} />}
                hasValue={!!startDate}
              >
                {startDate
                  ? format(startDate, 'EEEE, M/d/yy')
                  : 'Select Start Date'}
              </Pill>
            </Pressable>
            <Pressable
              onPress={() =>
                endDateSheetRef.current?.present({
                  selectedDate: endDate,
                  validStartDate: startDate,
                })
              }
            >
              <Pill
                icon={<Icon as={SunsetIcon} size={16} />}
                hasValue={!!endDate}
              >
                {endDate ? format(endDate, 'EEEE, M/d/yy') : 'Select End Date'}
              </Pill>
            </Pressable>
          </ScrollView>

          <Button onPress={handleCreateMealPlan}>
            <Text>Create Meal Plan</Text>
          </Button>
        </View>
      </BottomSheet>
    </>
  );
};
