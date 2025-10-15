import { cn } from '@/lib/utils';
import { TriggerRef } from '@rn-primitives/popover';
import { ClockIcon, XIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../components/ui/popover';
import { Text } from '../../../components/ui/text';
import { MealTag } from '../types';

const mealTimes: MealTag[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'dessert',
];

const MealTimeItem = ({
  mealTime,
  onSelect,
}: {
  mealTime: MealTag;
  onSelect: (mealTime: MealTag) => void;
}) => {
  return (
    <Pressable onPress={() => onSelect(mealTime)}>
      <Text className="text-sm font-medium capitalize text-foreground">
        {mealTime}
      </Text>
    </Pressable>
  );
};

type MealTimeSelectorProps = {
  mealTime?: MealTag;
  onSelect: (mealTime?: MealTag) => void;
};

export const MealTimeSelector = ({
  mealTime,
  onSelect,
}: MealTimeSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<TriggerRef>(null);

  return (
    <Popover>
      <View className="self-start">
        <PopoverTrigger
          ref={ref}
          className={cn(
            'flex-row items-center gap-2  rounded-full border border-border px-2 py-1 ',
            mealTime && 'pr-8'
          )}
        >
          <ClockIcon size={16} />
          <Text
            className={cn(
              'text-sm font-medium capitalize',
              mealTime ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {mealTime || 'Meal Time'}
          </Text>
        </PopoverTrigger>
        {mealTime && (
          <Pressable
            onPress={() => onSelect(undefined)}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            <XIcon color="black" size={16} />
          </Pressable>
        )}
      </View>
      <PopoverContent
        side="top"
        insets={{
          top: 16,
          bottom: 16,
          left: 16,
          right: 16,
        }}
        className="w-26 gap-1 py-2"
      >
        {mealTimes.map(mealTime => (
          <MealTimeItem
            key={mealTime}
            mealTime={mealTime}
            onSelect={() => {
              onSelect(mealTime);
              ref.current?.close();
            }}
          />
        ))}
      </PopoverContent>
    </Popover>
  );
};
