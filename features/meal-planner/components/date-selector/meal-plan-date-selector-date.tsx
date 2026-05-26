import { CheckIcon, Circle } from 'lucide-react-native';
import { memo } from 'react';
import { View } from 'react-native';
import { DraxDragWithReceiverEventData, DraxView } from 'react-native-drax';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { HapticPressable } from '../../../../components/ui/haptic-pressable';
import { Icon } from '../../../../components/ui/icon';
import { Text } from '../../../../components/ui/text';
import { cn } from '../../../../lib/utils';

type MealPlanDateSelectorDateProps = {
  date: Date;
  dateKey: string;
  dayLabel: string;
  weekdayLabel: string;
  isDateToday: boolean;
  isSelected: boolean;
  hasMeals: boolean;
  allMealsAdded: boolean;
  onPress: (date: Date) => void;
  onReceiveDragDrop: (date: Date, event: DraxDragWithReceiverEventData) => void;
  width: number;
  isDropEnabled: boolean;
};

const MealPlanDateSelectorDateComponent = ({
  date,
  dateKey,
  dayLabel,
  weekdayLabel,
  isDateToday,
  isSelected,
  hasMeals,
  onPress,
  onReceiveDragDrop,
  width,
  isDropEnabled,
}: MealPlanDateSelectorDateProps) => {
  const content = (
    <>
      {isSelected && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          className="bg-muted"
        ></Animated.View>
      )}
      <View className="absolute top-2 z-10 flex-row items-center gap-1">
        {hasMeals ? (
          <View className="size-4 items-center justify-center rounded-full bg-primary">
            <Icon
              as={CheckIcon}
              strokeWidth={3}
              size={10}
              className={cn('text-primary-foreground')}
            />
          </View>
        ) : (
          <Icon
            as={Circle}
            strokeWidth={3}
            size={14}
            className={cn('text-muted-foreground')}
          />
        )}
      </View>
      <View className={cn('items-center justify-center')}>
        <Text
          className={cn(
            '-mb-1 text-xl font-semibold text-muted-foreground',
            isSelected && 'text-foreground'
          )}
        >
          {dayLabel}
        </Text>
        <Text
          className={cn(
            'text-sm font-semibold',
            isSelected ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {weekdayLabel}
        </Text>
      </View>
      {isDateToday ? (
        <View className="absolute bottom-2 size-1.5 rounded-full bg-primary"></View>
      ) : null}
    </>
  );

  return (
    <HapticPressable style={{ width }} onPress={() => onPress(date)}>
      {isDropEnabled ? (
        <DraxView
          onReceiveDragDrop={event => onReceiveDragDrop(date, event)}
          draggable={false}
          collisionAlgorithm="center"
          className={cn(
            'shrink-0 grow-0 items-center overflow-hidden rounded-xl px-2 pb-4 pt-[22]'
          )}
          receivingStyle={{
            backgroundColor: 'rgba(245, 244, 244, 0.14)',
          }}
        >
          {content}
        </DraxView>
      ) : (
        <View
          className={cn(
            'shrink-0 grow-0 items-center overflow-hidden rounded-xl px-2 pb-4 pt-[22]'
          )}
        >
          {content}
        </View>
      )}
    </HapticPressable>
  );
};

export const MealPlanDateSelectorDate = memo(
  MealPlanDateSelectorDateComponent,
  (prev, next) =>
    prev.dateKey === next.dateKey &&
    prev.dayLabel === next.dayLabel &&
    prev.weekdayLabel === next.weekdayLabel &&
    prev.isDateToday === next.isDateToday &&
    prev.isSelected === next.isSelected &&
    prev.hasMeals === next.hasMeals &&
    prev.width === next.width &&
    prev.isDropEnabled === next.isDropEnabled &&
    prev.onPress === next.onPress &&
    prev.onReceiveDragDrop === next.onReceiveDragDrop
);
