import {
  ChevronDownIcon,
  MoreHorizontal,
  UsersIcon,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

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
  searchQuery?: string;
  matchingCount?: number;
  onClearListPress: () => void;
  onSharePress: () => void;
  onDeleteOrLeave: () => void;
  onEditNamePress: () => void;
  onTitlePress?: () => void;
};

export const GroceryListHeader = ({
  items,
  listName,
  listId,
  ownerId,
  isShared = false,
  searchQuery,
  matchingCount,
  onClearListPress,
  onSharePress,
  onDeleteOrLeave,
  onEditNamePress,
  onTitlePress,
}: GroceryListHeaderProps) => {
  const uncheckedItems = items.filter(item => !item.isChecked);
  const trimmedQuery = searchQuery?.trim() ?? '';
  const hasSearch = trimmedQuery.length > 0;

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
          <GroceryListDropdownMenu
            items={items}
            ownerId={ownerId}
            trigger={<Icon as={MoreHorizontal} size={24} />}
            onClearListPress={onClearListPress}
            onSharePress={onSharePress}
            onDeleteOrLeave={onDeleteOrLeave}
            onEditNamePress={onEditNamePress}
          />
        )}
      </View>
      <Text className="text-lg text-muted-foreground">
        {hasSearch
          ? `${matchingCount ?? 0} item${
              (matchingCount ?? 0) !== 1 ? 's' : ''
            } matching "${trimmedQuery}"`
          : `${uncheckedItems.length} items`}
      </Text>
    </View>
  );
};
