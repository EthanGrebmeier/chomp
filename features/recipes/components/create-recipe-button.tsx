import { navigation } from '@/lib/navigation';
import { router } from 'expo-router';
import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';
import { useTheme } from '../../../hooks/use-theme';
import { useCreateRecipe } from '../hooks';

type CreateRecipeButtonProps = {
  onSuccess?: (result: { id: string }) => void;
  onPress?: () => void;
};

export const CreateRecipeButton = ({
  onSuccess,
  onPress: onPressProp,
}: CreateRecipeButtonProps) => {
  const { mutate: createRecipe, isPending } = useCreateRecipe();
  const theme = useTheme();
  const handleCreateRecipe = () => {
    onPressProp?.();
    createRecipe(
      {
        recipe: {
          name: 'My Recipe',
          description: '',
        },
        ingredients: [],
      },
      {
        onSuccess: result => {
          router.push(navigation.goToRecipe(result.id, { autofocus: true }));
          onSuccess?.(result);
        },
      }
    );
  };
  return (
    <Button size="sm" onPress={handleCreateRecipe} disabled={isPending}>
      <Text>{isPending ? 'Creating...' : 'Create Recipe'}</Text>
    </Button>
  );
};
