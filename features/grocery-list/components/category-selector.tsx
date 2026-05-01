import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '../../../components/native-dropdown';
import { Pill } from '../../../components/ui/pill';
import { cn } from '../../../lib/utils';
import { categoryOptions } from '../../shared/category/categories';

type CategorySelectorProps = {
  category?: string;
  onSelect: (category?: string) => void;
};

export const CategorySelector = ({
  category,
  onSelect,
}: CategorySelectorProps) => {
  const selectedCategory = categoryOptions.find(opt => opt.value === category);

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger>
        <Pill
          className={cn(
            selectedCategory
              ? cn('border-transparent', selectedCategory.style.className)
              : 'border border-border bg-none'
          )}
          textClassName={cn(
            selectedCategory ? 'text-black' : 'text-muted-foreground'
          )}
        >
          {selectedCategory ? selectedCategory.label : 'Category'}
        </Pill>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuCheckboxItem
          key="none"
          value={!category ? 'on' : 'off'}
          onValueChange={() => onSelect(undefined)}
        >
          <DropdownMenuItemTitle>None</DropdownMenuItemTitle>
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
