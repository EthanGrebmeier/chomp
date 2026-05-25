import { format, isToday } from 'date-fns';
import { CheckIcon, Circle } from 'lucide-react-native';
import { useMemo } from 'react';
import { View } from 'react-native';
import { DraxDragWithReceiverEventData, DraxView } from 'react-native-drax';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { z } from 'zod';

import { HapticPressable } from '../../../../components/ui/haptic-pressable';
import { Icon } from '../../../../components/ui/icon';
import { Text } from '../../../../components/ui/text';
import { cn } from '../../../../lib/utils';
import {
  useUpdateMealPlanItemDate,
  useUpdateMealPlanRecipe,
} from '../../hooks';

type MealPlanDateSelectorDateProps = {
  date: Date;
  isSelected: boolean;
  hasMeals: boolean;
  allMealsAdded: boolean;
  onPress: (date: Date) => void;
  width: number;
  isDropEnabled: boolean;
};

export const MealPlanDateSelectorDate = ({
  date,
  isSelected,
  hasMeals,
  allMealsAdded,
  onPress,
  width,
  isDropEnabled,
}: MealPlanDateSelectorDateProps) => {
  const isDateToday = isToday(date);
  const dayLabel = useMemo(() => format(date, 'd'), [date]);
  const weekdayLabel = useMemo(() => format(date, 'EE'), [date]);
  const { mutate: updateMealPlanRecipe } = useUpdateMealPlanRecipe();
  const { mutate: updateMealPlanItemDate } = useUpdateMealPlanItemDate();

  const handleReceiveDragDrop = (event: DraxDragWithReceiverEventData) => {
    const droppedDate = format(date, 'yyyy-MM-dd');
    const payload = z
      .union([
        z.discriminatedUnion('type', [
          z.object({
            type: z.literal('recipe'),
            id: z.string(),
          }),
          z.object({
            type: z.literal('item'),
            id: z.string(),
          }),
        ]),
        z.object({
          recipeId: z.string(),
        }),
        z.object({
          itemId: z.string(),
        }),
      ])
      .parse(event.dragged?.payload);

    if ('recipeId' in payload) {
      updateMealPlanRecipe({
        mealPlanRecipeId: payload.recipeId,
        updates: {
          date: droppedDate,
        },
      });
      return;
    }

    if ('itemId' in payload) {
      updateMealPlanItemDate({
        mealPlanItemId: payload.itemId,
        date: droppedDate,
      });
      return;
    }

    if (payload.type === 'recipe') {
      updateMealPlanRecipe({
        mealPlanRecipeId: payload.id,
        updates: {
          date: droppedDate,
        },
      });
      return;
    }

    updateMealPlanItemDate({
      mealPlanItemId: payload.id,
      date: droppedDate,
    });
  };

  return (
    <HapticPressable style={{ width }} onPress={() => onPress(date)}>
      <DraxView
        onReceiveDragDrop={isDropEnabled ? handleReceiveDragDrop : undefined}
        draggable={false}
        collisionAlgorithm="center"
        className={cn(
          'shrink-0 grow-0 items-center overflow-hidden rounded-xl px-2 pb-4 pt-[22]'
        )}
        receivingStyle={{
          backgroundColor: 'rgba(245, 244, 244, 0.14)',
        }}
      >
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
        <View className={cn('items-center justify-center  ')}>
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
              'text-sm font-semibold ',
              isSelected ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {weekdayLabel}
          </Text>
        </View>
        {isDateToday && (
          <View className="absolute bottom-2 size-1.5 rounded-full bg-primary"></View>
        )}
      </DraxView>
    </HapticPressable>
  );
};
