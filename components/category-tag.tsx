import { categoryOptions } from '../features/shared/category/categories';
import { Icon } from './ui/icon';
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
  const { icon } = categoryOption.style;
  return (
    <Pill
      className="border-yellow-500 bg-yellow-100"
      icon={<Icon as={icon} size={16} />}
      hasValue={true}
    >
      <Text className="text-sm font-medium text-foreground">
        {categoryOption.label}
      </Text>
    </Pill>
  );
};
