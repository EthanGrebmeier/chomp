import { useNetworkState } from 'expo-network';
import { MoreHorizontal, WifiOff } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Heading } from '../../../components/text/heading';
import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
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
  selectedBulkItemCount: number;
  onEnterBulkSelectionMode: () => void;
  onExitBulkSelectionMode: () => void;
  onSelectAllBulkItems: () => void;
  onClearBulkSelection: () => void;
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
  selectedBulkItemCount,
  onEnterBulkSelectionMode,
  onExitBulkSelectionMode,
  onSelectAllBulkItems,
  onClearBulkSelection,
}: GroceryListHeaderProps) => {
  const networkState = useNetworkState();
  const isDisconnected =
    networkState.isConnected === false ||
    networkState.isInternetReachable === false;

  return (
    <View className="gap-2 px-4">
      <View className="flex-row items-center justify-between">
        <View className="h-10 flex-1 justify-center">
          {isBulkSelectionModeActive ? (
            <Animated.View
              key="bulk-left-controls"
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(120)}
              className="flex-row items-center gap-2"
            >
              <Button
                variant="ghost"
                className="h-8 px-0"
                onPress={onSelectAllBulkItems}
                hitSlop={14}
              >
                <Text className="text-sm font-medium text-foreground">
                  Select All
                </Text>
              </Button>
              <Button
                variant="ghost"
                className="h-8 px-0"
                onPress={onClearBulkSelection}
                disabled={selectedBulkItemCount === 0}
                hitSlop={14}
              >
                <Text className="text-sm font-medium text-foreground">
                  Clear All
                </Text>
              </Button>
            </Animated.View>
          ) : (
            <Animated.View
              key="default-left-controls"
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(120)}
              className="self-start"
            >
              <Button
                onPress={onViewListsPress}
                disabled={!onViewListsPress}
                variant="ghost"
                className="px-0 active:bg-transparent dark:active:bg-transparent"
              >
                <Heading>{listName ?? 'Grocery List'}</Heading>
              </Button>
            </Animated.View>
          )}
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
