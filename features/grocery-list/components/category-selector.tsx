import { TriggerRef } from '@rn-primitives/popover';
import { TagIcon } from 'lucide-react-native';
import { useRef } from 'react';
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
import { categoryOptions } from '../../shared/category/categories';

const CategoryItem = ({
  category,
  onSelect,
}: {
  category: (typeof categoryOptions)[number];
  onSelect: (category: (typeof categoryOptions)[number]) => void;
}) => {
  return (
    <HapticPressable
      onPress={() => onSelect(category)}
      className="flex-row items-center gap-2"
      hapticType="selection"
    >
      <Icon as={category.style.icon} size={16} />
      <Text className={cn('text-lg font-medium text-foreground')}>
        {category.label}
      </Text>
    </HapticPressable>
  );
};

type CategorySelectorProps = {
  category?: string;
  onSelect: (category?: string) => void;
};

export const CategorySelector = ({
  category,
  onSelect,
}: CategorySelectorProps) => {
  const ref = useRef<TriggerRef>(null);

  const selectedCategory = categoryOptions.find(opt => opt.value === category);

  return (
    <Popover>
      <PopoverTrigger className="self-start" ref={ref}>
        <Pill
          icon={
            <Icon
              as={selectedCategory ? selectedCategory.style.icon : TagIcon}
              size={16}
            />
          }
          hasValue={!!category}
          onClear={category ? () => onSelect(undefined) : undefined}
          className={cn(
            selectedCategory ? 'border-yellow-500 bg-yellow-100' : ' bg-none'
          )}
          textClassName={cn(
            selectedCategory ? 'text-black' : 'text-muted-foreground'
          )}
        >
          {selectedCategory ? selectedCategory.label : 'Category'}
        </Pill>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-48 py-2">
        {categoryOptions.map(categoryOption => (
          <CategoryItem
            key={categoryOption.value}
            category={categoryOption}
            onSelect={() => {
              onSelect(categoryOption.value);
              ref.current?.close();
            }}
          />
        ))}
      </PopoverContent>
    </Popover>
  );
};
