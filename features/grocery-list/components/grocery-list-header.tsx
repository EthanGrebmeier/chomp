import { useNetworkState } from 'expo-network';
import {
  ChevronDownIcon,
  MoreHorizontal,
  SettingsIcon,
  UsersIcon,
  WifiOff,
} from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Heading } from '../../../components/text/heading';
import { Icon } from '../../../components/ui/icon';
import { GroceryListItemWithRecipe } from '../types';

import { GroceryListDropdownMenu } from './dropdown-menu';

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
  onTitlePress?: () => void;
  onSettingsPress?: () => void;
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
  onTitlePress,
  onSettingsPress,
}: GroceryListHeaderProps) => {
  const networkState = useNetworkState();
  const isDisconnected =
    networkState.isConnected === false ||
    networkState.isInternetReachable === false;

  return (
    <View className="px-4">
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={onTitlePress}
          disabled={!onTitlePress}
          className="flex-row items-center gap-1 active:opacity-70"
        >
          <Heading>{listName ?? 'Grocery List'}</Heading>
          {isShared && (
            <Icon as={UsersIcon} size={20} className="text-muted-foreground" />
          )}
          {onTitlePress && (
            <Icon
              as={ChevronDownIcon}
              size={24}
              className="text-muted-foreground"
              strokeWidth={2.5}
            />
          )}
        </Pressable>
        {listId && (
          <View className="flex-row items-center gap-4">
            {isDisconnected && (
              <Icon as={WifiOff} size={20} className="text-destructive" />
            )}

            <GroceryListDropdownMenu
              items={items}
              ownerId={ownerId}
              trigger={<Icon as={MoreHorizontal} size={24} />}
              onClearListPress={onClearListPress}
              onSharePress={onSharePress}
              onDeleteOrLeave={onDeleteOrLeave}
              onEditNamePress={onEditNamePress}
            />
            {onSettingsPress && (
              <Pressable
                onPress={onSettingsPress}
                className="active:opacity-70"
                hitSlop={8}
              >
                <Icon as={SettingsIcon} size={22} className="text-foreground" />
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
};
