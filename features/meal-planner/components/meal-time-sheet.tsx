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
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { WithLayoutTransition } from '../../../components/animated/with-layout-transition';
import { BottomSheet } from '../../../components/bottom-sheet';
import { BackButton } from '../../../components/ui/back-button';
import { ConfirmButton } from '../../../components/ui/confirm-button';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Icon } from '../../../components/ui/icon';
import { Pill } from '../../../components/ui/pill';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';

type MealTimeOptionType = {
  value: string;
  label: string;
  icon: LucideIcon;
};

const mealTimeOptions: MealTimeOptionType[] = [
  { value: 'Breakfast', label: 'Breakfast', icon: CroissantIcon },
  { value: 'Lunch', label: 'Lunch', icon: SandwichIcon },
  { value: 'Dinner', label: 'Dinner', icon: CookingPotIcon },
  { value: 'Snack', label: 'Snack', icon: CoffeeIcon },
  { value: 'Dessert', label: 'Dessert', icon: CakeSliceIcon },
];

type MealTimeOptionProps = {
  label: string;
  isSelected: boolean;
  onPress: () => void;
};

const MealTimeOption = ({
  label,
  isSelected,
  onPress,
}: MealTimeOptionProps) => (
  <HapticPressable onPress={onPress} hapticType="selection">
    <View
      className={cn(
        'w-full flex-row items-center justify-center gap-3 rounded-xl px-2 py-3',
        isSelected && 'bg-muted'
      )}
    >
      <Text
        className={cn(
          'text-base font-medium',
          isSelected ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {label}
      </Text>
    </View>
  </HapticPressable>
);

type MealTimeSheetProps = {
  mealTime?: string;
  onSelect: (mealTime?: string) => void;
  canGoBack?: boolean;
  disabled?: boolean;
};

export const MealTimeSheet = ({
  mealTime,
  onSelect,
  canGoBack = true,
  disabled = false,
}: MealTimeSheetProps) => {
  const sheetRef = useRef<TrueSheet>(null);
  const [localMealTime, setLocalMealTime] = useState<string | undefined>(
    mealTime
  );

  const selectedMealTime = mealTimeOptions.find(opt => opt.value === mealTime);

  const openSheet = () => {
    if (disabled) return;
    setLocalMealTime(mealTime);
    sheetRef.current?.present();
  };

  const handleConfirm = () => {
    onSelect(localMealTime);
    sheetRef.current?.dismiss();
  };

  return (
    <>
      <WithLayoutTransition>
        <HapticPressable
          onPress={openSheet}
          hapticType="light"
          disabled={disabled}
        >
          <Pill
            className={cn(
              !mealTime && 'border-dashed',
              disabled && 'opacity-50'
            )}
            textClassName={cn(disabled && 'text-muted-foreground')}
            icon={
              <Icon
                className="text-muted-foreground"
                as={selectedMealTime?.icon ?? ClockIcon}
                size={16}
              />
            }
            hasValue={!!selectedMealTime}
            onClear={disabled ? undefined : () => onSelect(undefined)}
          >
            {selectedMealTime ? selectedMealTime.label : 'Meal Time'}
          </Pill>
        </HapticPressable>
      </WithLayoutTransition>

      <BottomSheet detents={['auto']} ref={sheetRef} name="meal-time-sheet">
        <BottomSheet.Header
          className="px-4"
          dismissButton={
            canGoBack && (
              <BackButton onPress={() => sheetRef.current?.dismiss()} />
            )
          }
          title="Meal Time"
          button={<ConfirmButton onPress={handleConfirm} />}
        />
        <View className="px-2">
          <MealTimeOption
            label="None"
            isSelected={!localMealTime}
            onPress={() => setLocalMealTime(undefined)}
          />

          {mealTimeOptions.map(option => (
            <MealTimeOption
              key={option.value}
              label={option.label}
              isSelected={localMealTime === option.value}
              onPress={() => setLocalMealTime(option.value)}
            />
          ))}
        </View>
      </BottomSheet>
    </>
  );
};
