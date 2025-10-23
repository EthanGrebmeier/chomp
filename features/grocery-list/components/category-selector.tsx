import { TriggerRef } from '@rn-primitives/popover';
import { TagIcon } from 'lucide-react-native';
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
import { categoryOptions } from '../../shared/category/categories';

const CategoryItem = ({
  category,
  onSelect,
}: {
  category: (typeof categoryOptions)[number];
  onSelect: (category: (typeof categoryOptions)[number]) => void;
}) => {
  return (
    <Pressable
      onPress={() => onSelect(category)}
      className="flex-row items-center gap-2"
    >
      <Icon as={category.style.icon} size={16} />
      <Text className={cn('text-lg font-medium text-foreground')}>
        {category.label}
      </Text>
    </Pressable>
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
  const [isOpen, setIsOpen] = useState(false);
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
            selectedCategory ? 'border-yellow-500 bg-yellow-100' : ' bg-muted'
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
