import { FlatList } from 'react-native';

import { CategoryLabel } from '../../../components/category-label';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { CategoryOption } from '../../shared/category/categories';

type CategoryRowProps = {
  category: CategoryOption;
  onPress?: () => void;
};

const CategoryRow = ({ category, onPress }: CategoryRowProps) => (
  <HapticPressable
    onPress={onPress}
    disabled={!onPress}
    hapticType="light"
    className="mx-2 flex-row items-center justify-center rounded-xl px-2 py-3"
  >
    <CategoryLabel
      color={category.color}
      containerClassName="max-w-full self-center"
      className="text-base font-medium"
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {category.label}
    </CategoryLabel>
  </HapticPressable>
);

type CategoriesListProps = {
  categories: CategoryOption[];
  canEdit: boolean;
  onEditCategory: (category: CategoryOption) => void;
};

export const CategoriesList = ({
  categories,
  canEdit,
  onEditCategory,
}: CategoriesListProps) => (
  <FlatList
    data={categories}
    renderItem={({ item }) => (
      <CategoryRow
        category={item}
        onPress={canEdit ? () => onEditCategory(item) : undefined}
      />
    )}
    keyExtractor={item => item.value}
    contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}
    showsVerticalScrollIndicator={false}
  />
);
