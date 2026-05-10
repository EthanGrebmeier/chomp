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
  return (
    <View>
      <Text
        className={cn(
          'text-xs font-medium leading-[1.1] tracking-[-0.2] text-muted-foreground'
        )}
      >
        {categoryOption.label}
      </Text>
    </View>
  );
};
