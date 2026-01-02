import { useMemo } from 'react';
import { FlatList, View } from 'react-native';

import { CategoryTag } from '../../../components/category-tag';
import { EmptyHeading } from '../../../components/text/empty-heading';
import { EmptySubtext } from '../../../components/text/empty-subtext';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { ListItem } from '../../../components/ui/list-item';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { categoryOptions } from '../../shared/category/categories';
import { UnifiedSavedItem } from '../types';
import { deleteSavedItem } from '../unified/delete-saved-item';

type SavedItemRowProps = {
  item: UnifiedSavedItem;
  isLast: boolean;
  onDelete: () => void;
  onPress: () => void;
};

const SavedItemRow = ({
  item,
  isLast,
  onDelete,
  onPress,
}: SavedItemRowProps) => {
  return (
    <ListItem
      className={cn(!isLast && 'border-b border-dashed border-border')}
      onDelete={onDelete}
    >
      <HapticPressable
        onPress={onPress}
        hapticType="light"
        className="flex-1 flex-row items-center justify-between py-1"
      >
        <Text className="text-base font-medium text-foreground">
          {item.name}
        </Text>
        {item.category && <CategoryTag category={item.category} />}
      </HapticPressable>
    </ListItem>
  );
};

type SavedItemsListProps = {
  items: UnifiedSavedItem[];
  sortBy: 'name' | 'category';
  onEditItem: (item: UnifiedSavedItem) => void;
};

export const SavedItemsList = ({
  items,
  sortBy,
  onEditItem,
}: SavedItemsListProps) => {
  const handleDelete = (item: UnifiedSavedItem) => {
    deleteSavedItem({ item });
  };

  // Get category order for sorting
  const categoryOrder = useMemo(() => {
    const order: Record<string, number> = {};
    categoryOptions.forEach((cat, index) => {
      order[cat.value] = index;
    });
    return order;
  }, []);

  // Sort items based on sortBy preference
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sortBy === 'category') {
        // Sort by category first, then alphabetically within category
        const categoryA = a.category ?? '';
        const categoryB = b.category ?? '';

        // Items without category go to the end
        if (!categoryA && categoryB) return 1;
        if (categoryA && !categoryB) return -1;

        // Sort by category order
        const orderA = categoryOrder[categoryA] ?? 999;
        const orderB = categoryOrder[categoryB] ?? 999;
        if (orderA !== orderB) return orderA - orderB;

        // Within same category, sort alphabetically
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      }

      // Default: sort alphabetically by name
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  }, [items, sortBy, categoryOrder]);

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <EmptyHeading>No saved items</EmptyHeading>
        <EmptySubtext>
          Items you add will appear here for quick access.
        </EmptySubtext>
      </View>
    );
  }

  return (
    <FlatList
      data={sortedItems}
      renderItem={({ item, index }) => (
        <SavedItemRow
          item={item}
          isLast={index === sortedItems.length - 1}
          onDelete={() => handleDelete(item)}
          onPress={() => onEditItem(item)}
        />
      )}
      keyExtractor={item => item.id}
      showsVerticalScrollIndicator={false}
    />
  );
};
