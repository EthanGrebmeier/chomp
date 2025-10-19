import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { ListItem } from '../../../components/ui/list-item';
import { useDeleteGroceryList } from '../hooks';
import { GroceryListWithItems } from '../types';

type GroceryListCardProps = {
  groceryList: GroceryListWithItems;
};

export const GroceryListCard = ({ groceryList }: GroceryListCardProps) => {
  const deleteGroceryList = useDeleteGroceryList();

  const handleDelete = () => {
    deleteGroceryList.mutate(
      { listId: groceryList.id },
      {
        onError: error => {
          console.error('Failed to delete grocery list:', error);
          // You could add a toast notification here if you have one
        },
      }
    );
  };

  return (
    <ListItem onDelete={handleDelete}>
      <Link className="w-full" href={`/lists/${groceryList.id}`}>
        <View>
          <Text numberOfLines={1} className="text-lg font-bold text-foreground">
            {groceryList.name}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {groceryList.items.length} items
          </Text>
        </View>
      </Link>
    </ListItem>
  );
};
