import { View } from 'react-native';

import { useCategoryOptions } from '../features/categories/use-category-options';
import {
  CategoryOption,
  getCategoryLabel,
} from '../features/shared/category/categories';

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
      <Text variant="caption" className="font-medium">
        {label}
      </Text>
    </View>
  );
};
