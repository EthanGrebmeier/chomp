import { categoryOptions } from '../features/shared/category/categories';
import { cn } from '../lib/utils';

import { Pill } from './ui/pill';
import { Text } from './ui/text';

type CategoryTagProps = {
  category: string;
};

export const CategoryTag = ({ category }: CategoryTagProps) => {
  const categoryOption = categoryOptions.find(opt => opt.value === category);
  if (!categoryOption) {
    return null;
  }
  const { className, textClassName } = categoryOption.style;
  return (
    <Pill className={cn('border border-border', className)} hasValue={true}>
      <Text className={cn('text-sm font-semibold', textClassName)}>
        {categoryOption.label}
      </Text>
    </Pill>
  );
};
