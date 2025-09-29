import { Button } from '@/components/ui/button';
import { router } from 'expo-router';
import { Text } from '../../../components/ui/text';
import { useAddGroceryList } from '../hooks/useAddGroceryList';

export const AddListSheet = () => {
  const { mutate: createList, isPending } = useAddGroceryList();

  const getDefaultName = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleCreateList = () => {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];

    createList(
      {
        list: {
          date: dateString,
          name: getDefaultName(today),
        },
      },
      {
        onSuccess: result => {
          router.push(`/${result.id}?autofocus=true`);
        },
      }
    );
  };

  return (
    <Button onPress={handleCreateList} disabled={isPending}>
      <Text>{isPending ? 'Creating...' : 'New List'}</Text>
    </Button>
  );
};
