import { View } from 'react-native';

import { categoryOptions } from '../features/shared/category/categories';
import { cn } from '../lib/utils';

import { Icon } from './ui/icon';
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
    <View className="flex-row items-center gap-1">
      <View>
        <Icon
          as={categoryOption.style.icon}
          size={12}
          strokeWidth={2}
          className={textClassName}
        />
      </View>
      <Text className={cn('text-xs font-semibold', textClassName)}>
        {categoryOption.label}
      </Text>
    </View>
  );
};
