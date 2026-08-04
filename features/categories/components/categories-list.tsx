import { Alert, SectionList, View } from 'react-native';
import { toast } from 'sonner-native';

import { CategoryLabel } from '../../../components/category-label';
import {
  ContextMenuItem,
  ContextMenuItemTitle,
  ContextMenuRoot,
} from '../../../components/ui/context-menu';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { ListItem } from '../../../components/ui/list-item';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import {
  CategoryOption,
  builtInCategoryOptions,
} from '../../shared/category/categories';
import { resolveCategoryColor } from '../../shared/category/category-colors';
import { deleteCategory } from '../instant/delete-category';
import { CustomCategory } from '../types';

type CategoryListItem =
  | (CategoryOption & { kind: 'built-in' })
  | (CustomCategory & { kind: 'custom' });

type CategoryListSection = {
  title: string;
  description?: string;
  data: CategoryListItem[];
};

type CategoryRowProps = {
  category: CategoryListItem;
  isLast: boolean;
  onDelete: () => void;
  onPress: () => void;
};

const CategoryRowContent = ({
  category,
  isLast,
  onDelete,
  onPress,
}: CategoryRowProps) => {
  const label = category.kind === 'built-in' ? category.label : category.name;
  const color = resolveCategoryColor(category.value, category.color);
  const isBuiltIn = category.kind === 'built-in';

  return (
    <ListItem
      className={cn(!isLast && 'border-b border-dashed border-border')}
      onDelete={isBuiltIn ? undefined : onDelete}
    >
      <HapticPressable
        onPress={onPress}
        disabled={isBuiltIn}
        hapticType="light"
        className="flex-1 flex-row items-center justify-between py-1"
      >
        <View className="flex-1 flex-row items-center">
          <CategoryLabel
            color={color}
            containerClassName="max-w-full self-center"
            className="text-base font-medium"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {label}
          </CategoryLabel>
        </View>
      </HapticPressable>
    </ListItem>
  );
};

const CategoryRow = ({
  category,
  isLast,
  onDelete,
  onPress,
}: CategoryRowProps) => {
  if (category.kind === 'built-in') {
    return (
      <CategoryRowContent
        category={category}
        isLast={isLast}
        onDelete={onDelete}
        onPress={onPress}
      />
    );
  }

  const handleConfirmDelete = () => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? Existing items will keep their category label.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <ContextMenuRoot
      trigger={
        <CategoryRowContent
          category={category}
          isLast={isLast}
          onDelete={onDelete}
          onPress={onPress}
        />
      }
    >
      <ContextMenuItem
        key={`delete-category-${category.id}`}
        destructive
        onSelect={handleConfirmDelete}
      >
        <ContextMenuItemTitle>Delete Category</ContextMenuItemTitle>
      </ContextMenuItem>
    </ContextMenuRoot>
  );
};

const CategorySectionHeader = ({
  title,
  description,
}: Pick<CategoryListSection, 'title' | 'description'>) => {
  return (
    <View className="bg-background px-4 pb-2 pt-5">
      <Text variant="overline">{title}</Text>
      {description ? (
        <Text variant="caption" className="mt-1">
          {description}
        </Text>
      ) : null}
    </View>
  );
};

type CategoriesListProps = {
  categories: CustomCategory[];
  onEditCategory: (category: CustomCategory) => void;
};

export const CategoriesList = ({
  categories,
  onEditCategory,
}: CategoriesListProps) => {
  const handleDelete = async (category: CustomCategory) => {
    try {
      await deleteCategory({ categoryId: category.id });
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const sortedCustomCategories = [...categories].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
  const categorySections: CategoryListSection[] = [];

  if (sortedCustomCategories.length > 0) {
    categorySections.push({
      title: 'Custom Categories',
      data: sortedCustomCategories.map(category => ({
        ...category,
        kind: 'custom' as const,
      })),
    });
  }

  categorySections.push({
    title: 'Default Categories',
    description: 'Built-in options available for every grocery list.',
    data: builtInCategoryOptions.map(category => ({
      ...category,
      kind: 'built-in' as const,
    })),
  });

  return (
    <SectionList
      sections={categorySections}
      renderSectionHeader={({ section }) => (
        <CategorySectionHeader
          title={section.title}
          description={section.description}
        />
      )}
      renderItem={({ item, index, section }) => (
        <CategoryRow
          category={item}
          isLast={index === section.data.length - 1}
          onDelete={() => {
            if (item.kind === 'custom') {
              handleDelete(item);
            }
          }}
          onPress={() => {
            if (item.kind === 'custom') {
              onEditCategory(item);
            }
          }}
        />
      )}
      keyExtractor={item =>
        item.kind === 'built-in'
          ? `built-in-${item.value}`
          : `custom-${item.id}`
      }
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
    />
  );
};
