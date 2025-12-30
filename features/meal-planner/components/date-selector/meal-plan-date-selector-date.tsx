import { format, isToday } from 'date-fns';
import { View } from 'react-native';

import { HapticPressable } from '../../../../components/ui/haptic-pressable';
import { Text } from '../../../../components/ui/text';
import { cn } from '../../../../lib/utils';

type MealPlanDateSelectorDateProps = {
  date: Date;
  isSelected: boolean;
  onPress: (date: Date) => void;
  width: number;
};

export const MealPlanDateSelectorDate = ({
  date,
  isSelected,
  onPress,
  width,
}: MealPlanDateSelectorDateProps) => {
  const isDateToday = isToday(date);
  return (
    <HapticPressable
      style={{ width }}
      onPress={() => onPress(date)}
      className={cn(
        'shrink-0 grow-0 items-center rounded-xl px-2 py-3',
        isSelected && 'bg-muted'
      )}
    >
      {isDateToday && (
        <View className="absolute top-2 z-10 size-1.5 rounded-full bg-accent-orange-foreground"></View>
      )}
      <View className={cn('items-center justify-center  ')}>
        <Text
          className={cn(
            '-mb-1 text-xl font-semibold text-muted-foreground',
            isSelected && 'text-foreground'
          )}
        >
          {format(date, 'd')}
        </Text>
        <Text
          className={cn(
            'text-sm font-semibold ',
            isSelected
              ? 'text-accent-orange-foreground'
              : 'text-muted-foreground'
          )}
        >
          {format(date, 'EEEEEE')}
        </Text>
      </View>
    </HapticPressable>
  );
};
