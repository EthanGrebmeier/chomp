import { View } from 'react-native';

import {
  CategoryOption,
  getCategoryColor,
  getCategoryLabel,
} from '../features/shared/category/categories';

import { CategoryLabel } from './category-label';

type CategoryTagProps = {
  category: string;
  categoryOptions: CategoryOption[];
};

export const CategoryTag = ({
  category,
  categoryOptions,
}: CategoryTagProps) => {
  const label = getCategoryLabel(categoryOptions, category);
  const color = getCategoryColor(categoryOptions, category);

  if (!label || !color) return null;

  return (
    <View>
      <CategoryLabel color={color} variant="caption" className="font-medium">
        {label}
      </CategoryLabel>
    </View>
  );
};
