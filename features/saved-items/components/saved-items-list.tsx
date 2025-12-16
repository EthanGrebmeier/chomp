import { FlatList, View } from 'react-native';

import { CategoryTag } from '../../../components/category-tag';
import { EmptyHeading } from '../../../components/text/empty-heading';
import { EmptySubtext } from '../../../components/text/empty-subtext';
import { ListItem } from '../../../components/ui/list-item';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { removeSavedItem } from '../instant/remove-saved-item';
import { SavedItem } from '../types';

type SavedItemRowProps = {
  item: SavedItem;
  isLast: boolean;
  onDelete: () => void;
};

const SavedItemRow = ({ item, isLast, onDelete }: SavedItemRowProps) => {
  return (
    <ListItem
      className={cn(!isLast && 'border-b border-dashed border-border')}
      onDelete={onDelete}
    >
      <View className="flex-1 flex-row items-center justify-between py-1">
        <Text className="text-base font-medium text-foreground">
          {item.name}
        </Text>
        {item.category && <CategoryTag category={item.category} />}
      </View>
    </ListItem>
  );
};

type SavedItemsListProps = {
  items: SavedItem[];
};

export const SavedItemsList = ({ items }: SavedItemsListProps) => {
  const handleDelete = (itemId: string) => {
    removeSavedItem({ itemId });
  };

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

  // Sort items alphabetically by name
  const sortedItems = [...items].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );

  return (
    <FlatList
      data={sortedItems}
      renderItem={({ item, index }) => (
        <SavedItemRow
          item={item}
          isLast={index === sortedItems.length - 1}
          onDelete={() => handleDelete(item.id)}
        />
      )}
      keyExtractor={item => item.id}
      showsVerticalScrollIndicator={false}
    />
  );
};
