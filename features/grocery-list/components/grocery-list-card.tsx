import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { GroceryListWithItems } from '../types';

type GroceryListCardProps = {
  groceryList: GroceryListWithItems;
};

export const GroceryListCard = ({ groceryList }: GroceryListCardProps) => {
  return (
    <Link
      href={`/${groceryList.id}`}
      className="w-full rounded-lg border border-border bg-background p-4"
    >
      <View>
        <Text numberOfLines={1} className="text-2xl font-bold text-foreground">
          {groceryList.name}
        </Text>
        <Text className="text-lg text-muted-foreground">
          {groceryList.items.length} items
        </Text>
      </View>
    </Link>
  );
};
