import { View } from 'react-native';

import { categoryOptions } from '../features/shared/category/categories';
import { cn } from '../lib/utils';

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
    <View
      className={cn(
        'items-center justify-center rounded-full border border-solid border-black px-2 py-0.5',
        className
      )}
    >
      <Text
        className={cn(
          'text-sm font-medium leading-[1.1] tracking-[-0.5]',
          textClassName
        )}
      >
        {categoryOption.label}
      </Text>
    </View>
  );
};
