import { TagIcon } from 'lucide-react-native';

import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '../../../components/native-dropdown';
import { Icon } from '../../../components/ui/icon';
import { Pill } from '../../../components/ui/pill';
import { cn } from '../../../lib/utils';
import { categoryOptions } from '../../shared/category/categories';

type CategoryFilterSelectorProps = {
  category?: string | null;
  onSelect: (category?: string) => void;
};

export const CategoryFilterSelector = ({
  category,
  onSelect,
}: CategoryFilterSelectorProps) => {
  const selectedCategory = categoryOptions.find(opt => opt.value === category);

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger>
        <Pill
          icon={
            <Icon
              as={selectedCategory ? selectedCategory.style.icon : TagIcon}
              className={
                selectedCategory ? 'text-black' : 'text-muted-foreground'
              }
              size={16}
            />
          }
          className={cn(
            selectedCategory
              ? cn('border-transparent', selectedCategory.style.className)
              : 'border border-border bg-none'
          )}
          textClassName={cn(
            selectedCategory ? 'text-black' : 'text-muted-foreground'
          )}
        >
          {selectedCategory ? selectedCategory.label : 'All Categories'}
        </Pill>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuCheckboxItem
          key="all"
          value={!category ? 'on' : 'off'}
          onValueChange={() => onSelect(undefined)}
        >
          <DropdownMenuItemTitle>All Categories</DropdownMenuItemTitle>
        </DropdownMenuCheckboxItem>
        {categoryOptions.map(categoryOption => (
          <DropdownMenuCheckboxItem
            key={categoryOption.value}
            value={category === categoryOption.value ? 'on' : 'off'}
            onValueChange={() => onSelect(categoryOption.value)}
          >
            <DropdownMenuItemTitle>
              {categoryOption.label}
            </DropdownMenuItemTitle>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};
