import { ChevronDownIcon, MoreHorizontal } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Heading } from '../../../components/text/heading';
import { Icon } from '../../../components/ui/icon';

import { GroceryListDropdownMenu } from './dropdown-menu';

type GroceryListHeaderProps = {
  itemCount: number;
  listName?: string;
  listId: string;
  openRecipeSheet: () => void;
  onClearListPress: () => void;
  onTitlePress?: () => void;
};

export const GroceryListHeader = ({
  itemCount,
  listName,
  listId,
  openRecipeSheet,
  onClearListPress,
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
        <GroceryListDropdownMenu
          listId={listId}
          trigger={<Icon as={MoreHorizontal} size={24} />}
          openRecipeSheet={openRecipeSheet}
          onClearListPress={onClearListPress}
        />
      </View>
      <Text className="text-lg text-muted-foreground">{itemCount} items</Text>
    </View>
  );
};
