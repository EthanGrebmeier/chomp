import { View } from 'react-native';

import { useCategoryOptions } from '../features/categories/use-category-options';
import {
  CategoryOption,
  getCategoryLabel,
} from '../features/shared/category/categories';
import { cn } from '../lib/utils';

import { Text } from './ui/text';

type CategoryTagProps = {
  category: string;
  categoryOptions?: CategoryOption[];
};

export const CategoryTag = ({
  category,
  categoryOptions: providedCategoryOptions,
}: CategoryTagProps) => {
  const { data: queriedCategoryOptions } = useCategoryOptions();
  const categoryOptions = providedCategoryOptions ?? queriedCategoryOptions;
  const label = getCategoryLabel(categoryOptions, category);

  return (
    <View>
      <Text
        className={cn(
          'text-xs font-medium leading-[1.1] tracking-[-0.2] text-muted-foreground'
        )}
      >
        {label}
      </Text>
    </View>
  );
};
