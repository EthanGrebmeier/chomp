import { useNetworkState } from 'expo-network';
import { MoreHorizontal, WifiOff } from 'lucide-react-native';
import { View } from 'react-native';

import { Heading } from '../../../components/text/heading';
import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
import {
  GroceryListGroupBy,
  GroceryListItemWithRecipe,
  GroceryListSortBy,
} from '../types';

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
  groupBy: GroceryListGroupBy;
  sortBy: GroceryListSortBy;
  onGroupByChange: (value: GroceryListGroupBy) => void;
  onSortByChange: (value: GroceryListSortBy) => void;
  onOpenAllGroupings: () => void;
  onCollapseAllGroupings: () => void;
  isBulkSelectionModeActive: boolean;
  onEnterBulkSelectionMode: () => void;
  onExitBulkSelectionMode: () => void;
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
  isBulkSelectionModeActive,
  onEnterBulkSelectionMode,
  onExitBulkSelectionMode,
}: GroceryListHeaderProps) => {
  const networkState = useNetworkState();
  const isDisconnected =
    networkState.isConnected === false ||
    networkState.isInternetReachable === false;

  return (
    <View className="gap-2 px-4">
      <View className="flex-row items-center justify-between">
        <View className="h-10 flex-1 justify-center">
          <View className="self-start">
            <Button
              onPress={onViewListsPress}
              disabled={!onViewListsPress}
              variant="ghost"
              className="px-0 active:bg-transparent dark:active:bg-transparent"
            >
              <Heading>{listName ?? 'Grocery List'}</Heading>
            </Button>
          </View>
        </View>
        {listId ? (
          <View className="h-10 flex-row items-center gap-4">
            {isDisconnected ? (
              <Icon as={WifiOff} size={20} className="text-destructive" />
            ) : null}
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
              trigger={<Icon hitSlop={14} as={MoreHorizontal} size={24} />}
              onClearListPress={onClearListPress}
              onSharePress={onSharePress}
              onDeleteOrLeave={onDeleteOrLeave}
              onEditNamePress={onEditNamePress}
              showBulkSelectionAction={true}
              isBulkSelectionModeActive={isBulkSelectionModeActive}
              onEnterBulkSelectionMode={onEnterBulkSelectionMode}
              onExitBulkSelectionMode={onExitBulkSelectionMode}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
};
