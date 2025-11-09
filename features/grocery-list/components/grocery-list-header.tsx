import { MoreHorizontal } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Heading } from '../../../components/text/heading';
import { Icon } from '../../../components/ui/icon';

import { GroceryListContextMenu } from './context-menu';

type GroceryListHeaderProps = {
  itemCount: number;
};

export const GroceryListHeader = ({ itemCount }: GroceryListHeaderProps) => {
  return (
    <View className="px-4">
      <View className="flex-row items-center justify-between">
        <View>
          <Heading>Grocery List</Heading>
        </View>
        <GroceryListContextMenu
          trigger={<Icon as={MoreHorizontal} size={24} />}
        />
      </View>
      <Text className="text-lg text-muted-foreground">{itemCount} items</Text>
    </View>
  );
};
