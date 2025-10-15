import { TriggerRef } from '@rn-primitives/popover';
import { ClockIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable } from 'react-native';
import { Pill } from '../../../components/ui/pill';
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
      <PopoverTrigger ref={ref}>
        <Pill
          icon={<ClockIcon size={16} />}
          hasValue={!!mealTime}
          onClear={mealTime ? () => onSelect(undefined) : undefined}
        >
          {mealTime
            ? mealTime.charAt(0).toUpperCase() + mealTime.slice(1)
            : 'Meal Time'}
        </Pill>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-28 gap-1 py-2">
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
