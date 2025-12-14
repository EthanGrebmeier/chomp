import { ChevronDownIcon, MoreHorizontal } from 'lucide-react-native';
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
  onClearListPress: () => void;
  onSharePress: () => void;
  onDeleteOrLeave: () => void;
  onTitlePress?: () => void;
};

export const GroceryListHeader = ({
  items,
  listName,
  listId,
  ownerId,
  onClearListPress,
  onSharePress,
  onDeleteOrLeave,
  onTitlePress,
}: GroceryListHeaderProps) => {
  return (
    <View className="px-4">
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={onTitlePress}
          disabled={!onTitlePress}
          className="flex-row items-center gap-1 active:opacity-70"
        >
          <Heading>{listName ?? 'Grocery List'}</Heading>
          {onTitlePress && (
            <Icon
              as={ChevronDownIcon}
              size={24}
              className="text-foreground"
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
          />
        )}
      </View>
      <Text className="text-lg text-muted-foreground">
        {items.length} items
      </Text>
    </View>
  );
};
