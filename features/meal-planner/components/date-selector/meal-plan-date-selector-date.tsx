import { format, isToday } from 'date-fns';
import { Circle, CircleCheck } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { HapticPressable } from '../../../../components/ui/haptic-pressable';
import { Icon } from '../../../../components/ui/icon';
import { Text } from '../../../../components/ui/text';
import { cn } from '../../../../lib/utils';

type MealPlanDateSelectorDateProps = {
  date: Date;
  isSelected: boolean;
  hasMeals: boolean;
  allMealsAdded: boolean;
  onPress: (date: Date) => void;
  width: number;
};

export const MealPlanDateSelectorDate = ({
  date,
  isSelected,
  hasMeals,
  allMealsAdded,
  onPress,
  width,
}: MealPlanDateSelectorDateProps) => {
  const isDateToday = isToday(date);
  return (
    <HapticPressable
      style={{ width }}
      onPress={() => onPress(date)}
      className={cn(
        'shrink-0 grow-0 items-center overflow-hidden rounded-xl px-2 pb-4 pt-[22]'
      )}
    >
      {isSelected && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          className="bg-muted"
        ></Animated.View>
      )}
      <View className="absolute top-2 z-10 flex-row items-center gap-1">
        {hasMeals ? (
          <Icon
            as={CircleCheck}
            strokeWidth={3}
            size={14}
            className={cn(
              allMealsAdded
                ? 'text-accent-orange-foreground'
                : 'text-muted-foreground'
            )}
          />
        ) : (
          <Icon
            as={Circle}
            strokeWidth={3}
            size={14}
            className={cn('text-muted-foreground')}
          />
        )}
      </View>
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
          {format(date, 'EE')}
        </Text>
      </View>
      {isDateToday && (
        <View className="absolute bottom-2 size-1.5 rounded-full bg-accent-orange-foreground"></View>
      )}
    </HapticPressable>
  );
};
