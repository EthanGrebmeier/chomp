import { TriggerRef } from '@rn-primitives/popover';
import { ArrowDownUpIcon } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable } from 'react-native';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { Icon } from '../../../components/ui/icon';
import { Pill } from '../../../components/ui/pill';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../components/ui/popover';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';

const SortByItem = ({
  label,
  value,
  onSelect,
}: {
  label: string;
  value: 'name' | 'recent';
  onSelect: (value: 'name' | 'recent') => void;
}) => {
  return (
    <Pressable
      onPress={() => onSelect(value)}
      className="flex-row items-center gap-2"
    >
      <Text className={cn('text-lg font-medium text-foreground')}>{label}</Text>
    </Pressable>
  );
};

type SortBySelectorProps = {
  value?: 'name' | 'recent';
  onChange: (value: 'name' | 'recent') => void;
};

export const SortBySelector = ({
  value = 'recent',
  onChange,
}: SortBySelectorProps) => {
  const ref = useRef<TriggerRef>(null);

  const getDisplayLabel = (value: 'name' | 'recent') => {
    switch (value) {
      case 'name':
        return 'Sort: Alphabetical';
      case 'recent':
        return 'Sort: Recent';
      default:
        return 'Sort: Recent';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild className="self-start" ref={ref}>
        <HapticPressable>
          <Pill
            icon={<Icon as={ArrowDownUpIcon} size={16} />}
            hasValue={value !== 'recent'}
            onClear={value !== 'recent' ? () => onChange('recent') : undefined}
          >
            {getDisplayLabel(value)}
          </Pill>
        </HapticPressable>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-44 gap-1 py-2">
        <SortByItem
          label="Alphabetical"
          value="name"
          onSelect={() => {
            onChange('name');
            ref.current?.close();
          }}
        />
        <SortByItem
          label="Recent"
          value="recent"
          onSelect={() => {
            onChange('recent');
            ref.current?.close();
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
