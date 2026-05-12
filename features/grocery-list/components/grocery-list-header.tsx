import { useNetworkState } from 'expo-network';
import { MoreHorizontal, WifiOff, X } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

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
                <Text className="text-2xl font-bold tracking-tight">
                  {listName ?? 'Grocery List'}
                </Text>
              </Button>
            </Animated.View>
          )}
        </View>
        {listId && (
          <View className="h-10 flex-row items-center gap-4">
            {isDisconnected ? (
              <Icon as={WifiOff} size={20} className="text-destructive" />
            ) : null}
            {isBulkSelectionModeActive ? (
              <Animated.View
                key="bulk-right-controls"
                entering={FadeIn.duration(180)}
                exiting={FadeOut.duration(120)}
              >
                <Button
                  variant="ghost"
                  className="h-8 px-0"
                  onPress={onExitBulkSelectionMode}
                >
                  <Icon
                    as={X}
                    strokeWidth={3}
                    size={20}
                    className="text-foreground"
                  />
                </Button>
              </Animated.View>
            ) : (
              <Animated.View
                key="default-right-controls"
                entering={FadeIn.duration(180)}
                exiting={FadeOut.duration(120)}
                className="flex-row items-center gap-4"
              >
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
                  showEnterBulkSelectionAction={true}
                  onEnterBulkSelectionMode={onEnterBulkSelectionMode}
                />
              </Animated.View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};
