import { FlatList, View } from 'react-native';

import { EmptyHeading } from '../../../components/text/empty-heading';
import { EmptySubtext } from '../../../components/text/empty-subtext';
import { HapticPressable } from '../../../components/ui/haptic-pressable';
import { ListItem } from '../../../components/ui/list-item';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { Store } from '../types';

type StoreRowProps = {
  store: Store;
  isLast: boolean;
  onPress: () => void;
};

const StoreRow = ({ store, isLast, onPress }: StoreRowProps) => (
  <ListItem className={cn(!isLast && 'border-b border-dashed border-border')}>
    <HapticPressable
      onPress={onPress}
      hapticType="light"
      className="flex-1 flex-row items-center justify-between py-1"
    >
      <View className="flex-1 flex-row items-center gap-2">
        <Text
          className="flex-1 text-base font-medium text-foreground"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {store.name}
        </Text>
        {store.isDefault ? (
          <View className="rounded-full bg-primary/10 px-2 py-0.5">
            <Text className="text-xs font-semibold text-primary">Default</Text>
          </View>
        ) : null}
      </View>
    </HapticPressable>
  </ListItem>
);

type StoresListProps = {
  stores: Store[];
  onEditStore: (store: Store) => void;
};

export const StoresList = ({ stores, onEditStore }: StoresListProps) => {
  if (stores.length === 0) {
    return (
      <View className="-mt-32 flex-1 items-center justify-center px-4">
        <EmptyHeading>No stores</EmptyHeading>
        <EmptySubtext>
          Stores help organize where you shop for items.
        </EmptySubtext>
      </View>
    );
  }

  // Sort default first, then alphabetically by name.
  const sortedStores = [...stores].sort(
    (a, b) =>
      Number(!!b.isDefault) - Number(!!a.isDefault) ||
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );

  return (
    <FlatList
      data={sortedStores}
      renderItem={({ item, index }) => (
        <StoreRow
          store={item}
          isLast={index === sortedStores.length - 1}
          onPress={() => onEditStore(item)}
        />
      )}
      keyExtractor={item => item.id}
      showsVerticalScrollIndicator={false}
    />
  );
};
