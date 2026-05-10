import { useNetworkState } from 'expo-network';
import { MoreHorizontal, WifiOff } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { GroceryListItemWithRecipe } from '../types';

import { GroceryListDropdownMenu } from './dropdown-menu';
import { ListFilterDropdownMenu } from './list-filter-dropdown-menu';

type GroceryListHeaderProps = {
  items: GroceryListItemWithRecipe[];
  listName?: string;
  listId?: string;
  ownerId?: string;
  isShared?: boolean;
  onClearListPress: () => void;
  onSharePress: () => void;
  onDeleteOrLeave: () => void;
  onEditNamePress: () => void;
  onViewListsPress?: () => void;
  groupBy: 'category' | 'none' | 'recipe' | 'store';
  sortBy: 'name' | 'recent';
  onGroupByChange: (value: 'category' | 'none' | 'recipe' | 'store') => void;
  onSortByChange: (value: 'name' | 'recent') => void;
  onOpenAllGroupings: () => void;
  onCollapseAllGroupings: () => void;
};

export const GroceryListHeader = ({
  items,
  listName,
  listId,
  ownerId,
  isShared = false,
  onClearListPress,
  onSharePress,
  onDeleteOrLeave,
  onEditNamePress,
  onViewListsPress,
  groupBy,
  sortBy,
  onGroupByChange,
  onSortByChange,
  onOpenAllGroupings,
  onCollapseAllGroupings,
}: GroceryListHeaderProps) => {
  const networkState = useNetworkState();
  const isDisconnected =
    networkState.isConnected === false ||
    networkState.isInternetReachable === false;

  return (
    <View className="gap-2 px-4">
      <View className="flex-row items-center justify-between">
        <Button
          onPress={onViewListsPress}
          disabled={!onViewListsPress}
          variant="ghost"
          className="px-0 active:bg-transparent dark:active:bg-transparent"
        >
          <Text className="text-3xl font-bold">
            {listName ?? 'Grocery List'}
          </Text>
        </Button>
        {listId && (
          <View className="flex-row items-center gap-4">
            {isDisconnected && (
              <Icon as={WifiOff} size={20} className="text-destructive" />
            )}
            <ListFilterDropdownMenu
              groupBy={groupBy}
              sortBy={sortBy}
              hasEnabledGroupings={groupBy !== 'none'}
              onGroupByChange={onGroupByChange}
              onSortByChange={onSortByChange}
              onOpenAllGroupings={onOpenAllGroupings}
              onCollapseAllGroupings={onCollapseAllGroupings}
            />

            <GroceryListDropdownMenu
              items={items}
              ownerId={ownerId}
              trigger={<Icon as={MoreHorizontal} size={24} />}
              onClearListPress={onClearListPress}
              onSharePress={onSharePress}
              onDeleteOrLeave={onDeleteOrLeave}
              onEditNamePress={onEditNamePress}
            />
          </View>
        )}
      </View>
    </View>
  );
};
