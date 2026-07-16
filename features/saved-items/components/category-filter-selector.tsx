import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '../../../components/native-dropdown';
import { Pill } from '../../../components/ui/pill';
import { cn } from '../../../lib/utils';
import { useCategoryOptions } from '../../categories/use-category-options';
import {
  getCategoryColor,
  getCategoryLabel,
} from '../../shared/category/categories';
import { getCategoryTextClassName } from '../../shared/category/category-colors';

type CategoryFilterSelectorProps = {
  category?: string | null;
  onSelect: (category?: string) => void;
};

export const CategoryFilterSelector = ({
  category,
  onSelect,
}: CategoryFilterSelectorProps) => {
  const { data: categoryOptions } = useCategoryOptions();
  const selectedCategoryLabel = getCategoryLabel(categoryOptions, category);
  const selectedCategoryColor = getCategoryColor(categoryOptions, category);
  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger>
        <Pill
          className={cn(
            selectedCategoryLabel
              ? 'border border-border'
              : 'border-transparent'
          )}
          textClassName={
            selectedCategoryColor
              ? getCategoryTextClassName(selectedCategoryColor)
              : 'text-muted-foreground'
          }
        >
          {selectedCategoryLabel ?? 'All Categories'}
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
