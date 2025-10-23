import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { ListItem } from '../../../components/ui/list-item';
import { useDeleteGroceryList } from '../hooks';
import { GroceryListWithItems } from '../types';

type GroceryListCardProps = {
  groceryList: GroceryListWithItems;
  className?: string;
};

export const GroceryListCard = ({
  groceryList,
  className,
}: GroceryListCardProps) => {
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
    <ListItem onDelete={handleDelete} className={className}>
      <Link className="w-full" href={`/lists/${groceryList.id}`}>
        <View>
          <Text
            numberOfLines={1}
            className="text-2xl font-bold text-foreground"
          >
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
