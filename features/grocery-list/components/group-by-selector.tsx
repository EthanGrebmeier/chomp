import { TriggerRef } from '@rn-primitives/popover';
import { Rows3Icon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable } from 'react-native';
import { Icon } from '../../../components/ui/icon';
import { Pill } from '../../../components/ui/pill';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../components/ui/popover';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';

const GroupByItem = ({
  label,
  value,
  onSelect,
}: {
  label: string;
  value: 'category' | 'none' | 'recipe';
  onSelect: (value: 'category' | 'none' | 'recipe') => void;
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

type GroupBySelectorProps = {
  value?: 'category' | 'none' | 'recipe';
  onChange: (value: 'category' | 'none' | 'recipe') => void;
};

export const GroupBySelector = ({
  value = 'none',
  onChange,
}: GroupBySelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<TriggerRef>(null);

  const getDisplayLabel = (value: 'category' | 'none' | 'recipe') => {
    switch (value) {
      case 'category':
        return 'Group by: Category';
      case 'recipe':
        return 'Group by: Recipe';
      case 'none':
        return 'Group by: None';
      default:
        return 'Group by: None';
    }
  };

  return (
    <Popover>
      <PopoverTrigger className="self-start" ref={ref}>
        <Pill
          icon={<Icon as={Rows3Icon} size={16} />}
          hasValue={value !== 'none'}
          onClear={value !== 'none' ? () => onChange('none') : undefined}
        >
          {getDisplayLabel(value)}
        </Pill>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-44 gap-1 py-2">
        <GroupByItem
          label="None"
          value="none"
          onSelect={() => {
            onChange('none');
            ref.current?.close();
          }}
        />
        <GroupByItem
          label="Category"
          value="category"
          onSelect={() => {
            onChange('category');
            ref.current?.close();
          }}
        />
        <GroupByItem
          label="Recipe"
          value="recipe"
          onSelect={() => {
            onChange('recipe');
            ref.current?.close();
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
