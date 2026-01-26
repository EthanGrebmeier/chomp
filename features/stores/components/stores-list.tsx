import { Alert, FlatList, View } from 'react-native';
import { toast } from 'sonner-native';

import { EmptyHeading } from '../../../components/text/empty-heading';
import { EmptySubtext } from '../../../components/text/empty-subtext';
import {
  ContextMenuItem,
  ContextMenuItemTitle,
  ContextMenuRoot,
} from '../../../components/ui/context-menu';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { ListItem } from '../../../components/ui/list-item';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { deleteStore } from '../instant/delete-store';
import { Store } from '../types';

type StoreRowProps = {
  store: Store;
  isLast: boolean;
  onDelete: () => void;
  onPress: () => void;
};

const StoreRow = ({ store, isLast, onDelete, onPress }: StoreRowProps) => {
  const handleConfirmDelete = () => {
    Alert.alert(
      'Delete Store',
      `Are you sure you want to delete "${store.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <ContextMenuRoot
      trigger={
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
              {store.name}
            </Text>
          </HapticPressable>
        </ListItem>
      }
    >
      <ContextMenuItem
        key={`delete-store-${store.id}`}
        destructive
        onSelect={handleConfirmDelete}
      >
        <ContextMenuItemTitle>Delete Store</ContextMenuItemTitle>
      </ContextMenuItem>
    </ContextMenuRoot>
  );
};

type StoresListProps = {
  stores: Store[];
  onEditStore: (store: Store) => void;
};

export const StoresList = ({ stores, onEditStore }: StoresListProps) => {
  const handleDelete = async (store: Store) => {
    try {
      await deleteStore({ storeId: store.id });
      toast.success(`Store "${store.name}" deleted`);
    } catch (error) {
      toast.error('Failed to delete store');
    }
  };

  if (stores.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <EmptyHeading>No stores</EmptyHeading>
        <EmptySubtext>
          Create stores to organize where you shop for items.
        </EmptySubtext>
      </View>
    );
  }

  // Sort stores alphabetically by name
  const sortedStores = [...stores].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );

  return (
    <FlatList
      data={sortedStores}
      renderItem={({ item, index }) => (
        <StoreRow
          store={item}
          isLast={index === sortedStores.length - 1}
          onDelete={() => handleDelete(item)}
          onPress={() => onEditStore(item)}
        />
      )}
      keyExtractor={item => item.id}
      showsVerticalScrollIndicator={false}
    />
  );
};

