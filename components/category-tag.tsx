import { InboxIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { categoryOptions } from '../features/shared/category/categories';

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
        <InboxIcon
          size={12}
          strokeWidth={2}
          className="text-muted-foreground"
        />
      </View>
      <Text className="text-xs font-semibold text-muted-foreground">
        {categoryOption.label}
      </Text>
    </View>
  );
};
