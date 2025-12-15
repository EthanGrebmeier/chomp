import { format } from 'date-fns';
import { View } from 'react-native';

import { HapticPressable } from '../../../../components/ui/haptic-pressable';
import { Text } from '../../../../components/ui/text';
import { cn } from '../../../../lib/utils';

type MealPlanDateSelectorDateProps = {
  date: Date;
  isSelected: boolean;
  onPress: (date: Date) => void;
};

export const MealPlanDateSelectorDate = ({
  date,
  isSelected,
  onPress,
}: MealPlanDateSelectorDateProps) => {
  return (
    <HapticPressable onPress={() => onPress(date)} className="items-center">
      <View
        className={cn(
          'items-center justify-center rounded-xl px-3 py-2',
          isSelected && 'bg-muted'
        )}
      >
        <Text
          className={cn(
            'text-base font-semibold text-muted-foreground',
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
