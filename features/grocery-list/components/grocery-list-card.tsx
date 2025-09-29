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
      className="flex-1/2 aspect-square rounded-lg border border-border bg-background p-4"
    >
      <View>
        <Text className="text-2xl font-bold text-foreground">
          {groceryList.date}
        </Text>
        <Text className="text-lg text-muted-foreground">
          {groceryList.items.length} items
        </Text>
      </View>
    </Link>
  );
};
