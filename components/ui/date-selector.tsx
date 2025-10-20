import { TriggerRef } from '@rn-primitives/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from './icon';
import { Pill } from './pill';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Text } from './text';

type DateSelectorProps = {
  date?: string;
  onSelect: (date: string) => void;
  onClear?: () => void;
  daysOfPlan: Date[];
};

export const DateSelector = ({
  date,
  onSelect,
  onClear,
  daysOfPlan,
}: DateSelectorProps) => {
  const ref = useRef<TriggerRef>(null);

  return (
    <Popover>
      <PopoverTrigger ref={ref}>
        <Pill icon={<Icon as={CalendarIcon} size={16} />} hasValue={!!date}>
          {date
            ? new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })
            : 'Select Date'}
        </Pill>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        insets={{
          top: 16,
          bottom: 16,
          left: 16,
          right: 16,
        }}
      >
        <View className="gap-1">
          {daysOfPlan.map(date => (
            <Pressable
              key={date.toISOString()}
              onPress={() => {
                onSelect(date.toISOString());
                ref.current?.close();
              }}
              className="flex-row items-center justify-between rounded-lg border border-border p-3"
            >
              <Text className="text-base font-medium text-foreground">
                {format(date, 'EEEE, M/d/yy')}
              </Text>
              <Icon
                as={CalendarIcon}
                size={16}
                className="text-muted-foreground"
              />
            </Pressable>
          ))}
        </View>
      </PopoverContent>
    </Popover>
  );
};
