import { TriggerRef } from '@rn-primitives/popover';
import { TagIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable } from 'react-native';
import { Pill } from '../../../components/ui/pill';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../components/ui/popover';
import { Text } from '../../../components/ui/text';

const categoryOptions = [
  { label: 'Produce', value: 'produce' },
  { label: 'Deli', value: 'deli' },
  { label: 'Meat', value: 'meat' },
  { label: 'Dairy', value: 'dairy' },
  { label: 'Bakery', value: 'bakery' },
  { label: 'Frozen', value: 'frozen' },
  { label: 'Pantry', value: 'pantry' },
  { label: 'Beverages', value: 'beverages' },
  { label: 'Snacks', value: 'snacks' },
  { label: 'Health & Beauty', value: 'health-beauty' },
  { label: 'Household', value: 'household' },
  { label: 'Other', value: 'other' },
] as const;

const CategoryItem = ({
  category,
  onSelect,
}: {
  category: (typeof categoryOptions)[number];
  onSelect: (category: (typeof categoryOptions)[number]) => void;
}) => {
  return (
    <Pressable onPress={() => onSelect(category)}>
      <Text className="text-sm font-medium text-foreground">
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
      <PopoverTrigger ref={ref}>
        <Pill
          icon={<TagIcon size={16} />}
          hasValue={!!category}
          onClear={category ? () => onSelect(undefined) : undefined}
        >
          {selectedCategory ? selectedCategory.label : 'Category'}
        </Pill>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-32 gap-1 py-2">
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
