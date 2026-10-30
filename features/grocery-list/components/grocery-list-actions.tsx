import { useNetworkState } from 'expo-network';
import { WifiOff } from 'lucide-react-native';
import { View } from 'react-native';

import { HeaderMenuTrigger } from '@/components/ui/header-action';

import { Icon } from '../../../components/ui/icon';
import {
  GroceryListGroupBy,
  GroceryListItemWithRecipe,
  GroceryListSortBy,
} from '../types';

import { GroceryListDropdownMenu } from './dropdown-menu';
import { ListFilterDropdownMenu } from './list-filter-dropdown-menu';

type GroceryListActionsProps = {
  onPurchasedItems: () => void;
  onStartShopping: () => void;
  canStartShopping: boolean;
  items: GroceryListItemWithRecipe[];
  ownerId?: string;
  groupBy: GroceryListGroupBy;
  sortBy: GroceryListSortBy;
  onClearListPress: () => void;
  onSharePress: () => void;
  onDeleteOrLeave: () => void;
  onEditNamePress: () => void;
  onGroupByChange: (value: GroceryListGroupBy) => void;
  onSortByChange: (value: GroceryListSortBy) => void;
  onOpenAllGroupings: () => void;
  onCollapseAllGroupings: () => void;
  isBulkSelectionModeActive: boolean;
  onEnterBulkSelectionMode: () => void;
  onExitBulkSelectionMode: () => void;
};

export function GroceryListActions({
  onPurchasedItems,
  onStartShopping,
  canStartShopping,
  items,
  ownerId,
  groupBy,
  sortBy,
  onClearListPress,
  onSharePress,
  onDeleteOrLeave,
  onEditNamePress,
  onGroupByChange,
  onSortByChange,
  onOpenAllGroupings,
  onCollapseAllGroupings,
  isBulkSelectionModeActive,
  onEnterBulkSelectionMode,
  onExitBulkSelectionMode,
}: GroceryListActionsProps) {
  const networkState = useNetworkState();
  const isDisconnected =
    networkState.isConnected === false ||
    networkState.isInternetReachable === false;

  return (
    <View className="h-11 flex-row items-center gap-2">
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
        onPurchasedItems={onPurchasedItems}
        onStartShopping={onStartShopping}
        canStartShopping={canStartShopping}
        items={items}
        ownerId={ownerId}
        trigger={
          <HeaderMenuTrigger
            size="regular"
            accessibilityLabel="Grocery list actions"
          />
        }
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
  );
}
