import { TrueSheet } from '@lodev09/react-native-true-sheet';
import {
  CakeSliceIcon,
  ClockIcon,
  CoffeeIcon,
  CookingPotIcon,
  CroissantIcon,
  LucideIcon,
  SandwichIcon,
} from 'lucide-react-native';
import { useRef } from 'react';
import { ScrollView, View } from 'react-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { BackButton } from '../../../components/ui/back-button';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Icon } from '../../../components/ui/icon';
import { Pill } from '../../../components/ui/pill';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { MealTag } from '../types';

type MealTimeOption = {
  value: MealTag;
  label: string;
  icon: LucideIcon;
};

const mealTimeOptions: MealTimeOption[] = [
  { value: 'Breakfast', label: 'Breakfast', icon: CroissantIcon },
  { value: 'Lunch', label: 'Lunch', icon: SandwichIcon },
  { value: 'Dinner', label: 'Dinner', icon: CookingPotIcon },
  { value: 'Snack', label: 'Snack', icon: CoffeeIcon },
  { value: 'Dessert', label: 'Dessert', icon: CakeSliceIcon },
];

type MealTimeOptionProps = {
  label: string;
  icon: LucideIcon;
  isSelected: boolean;
  onPress: () => void;
};

const MealTimeOption = ({
  label,
  icon,
  isSelected,
  onPress,
}: MealTimeOptionProps) => (
  <HapticPressable onPress={onPress} hapticType="selection">
    <View
      className={cn(
        'flex-row items-center gap-3 rounded-xl px-2 py-3',
        isSelected && 'bg-muted'
      )}
    >
      <View className="size-10 items-center justify-center rounded-full bg-muted">
        <Icon as={icon} size={20} className="text-foreground" />
      </View>
      <Text
        className={cn(
          'flex-1 text-base font-medium',
          isSelected ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {label}
      </Text>
    </View>
  </HapticPressable>
);

type MealTimeSheetProps = {
  mealTime?: MealTag;
  onSelect: (mealTime?: MealTag) => void;
};

export const MealTimeSheet = ({ mealTime, onSelect }: MealTimeSheetProps) => {
  const sheetRef = useRef<TrueSheet>(null);

  const selectedMealTime = mealTimeOptions.find(opt => opt.value === mealTime);

  const openSheet = () => {
    sheetRef.current?.present();
  };

  const handleSelect = (value?: MealTag) => {
    onSelect(value);
    sheetRef.current?.dismiss();
  };

  return (
    <>
      <HapticPressable onPress={openSheet} hapticType="light">
        <Pill
          icon={
            <Icon
              className="text-muted-foreground"
              as={selectedMealTime?.icon ?? ClockIcon}
              size={16}
            />
          }
          hasValue={!!selectedMealTime}
          onClear={() => onSelect(undefined)}
        >
          {selectedMealTime ? selectedMealTime.label : 'Meal Time'}
        </Pill>
      </HapticPressable>

      <BottomSheet ref={sheetRef} name="meal-time-sheet">
        <View className="flex-row items-center gap-2 pb-2">
          <BackButton onPress={() => sheetRef.current?.dismiss()} />
          <BottomSheet.Header title="Meal Time" />
        </View>
        <ScrollView
          className="max-h-96"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <MealTimeOption
            label="None"
            icon={ClockIcon}
            isSelected={!mealTime}
            onPress={() => handleSelect(undefined)}
          />

          {mealTimeOptions.map(option => (
            <MealTimeOption
              key={option.value}
              label={option.label}
              icon={option.icon}
              isSelected={mealTime === option.value}
              onPress={() => handleSelect(option.value)}
            />
          ))}
        </ScrollView>
      </BottomSheet>
    </>
  );
};

