import { categoryOptions } from '../features/shared/category/categories';
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
      className="border-2 border-black bg-[#ECD92B]"
      // icon={<Icon as={icon} color="black" size={16} strokeWidth={3} />}
      hasValue={true}
    >
      <Text className="text-sm font-semibold text-black">
        {categoryOption.label}
      </Text>
    </Pill>
  );
};
