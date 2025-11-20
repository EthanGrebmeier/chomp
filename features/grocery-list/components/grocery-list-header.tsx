import { MoreHorizontal } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Heading } from '../../../components/text/heading';
import { Icon } from '../../../components/ui/icon';

import { GroceryListDropdownMenu } from './dropdown-menu';

type GroceryListHeaderProps = {
  itemCount: number;
  openRecipeSheet: () => void;
  onClearListPress: () => void;
};

export const GroceryListHeader = ({
  itemCount,
  openRecipeSheet,
  onClearListPress,
}: GroceryListHeaderProps) => {
  return (
    <View className="px-4">
      <View className="flex-row items-center justify-between">
        <View>
          <Heading>Grocery List</Heading>
        </View>
        <GroceryListDropdownMenu
          trigger={<Icon as={MoreHorizontal} size={24} />}
          openRecipeSheet={openRecipeSheet}
          onClearListPress={onClearListPress}
        />
      </View>
      <Text className="text-lg text-muted-foreground">{itemCount} items</Text>
    </View>
  );
};
