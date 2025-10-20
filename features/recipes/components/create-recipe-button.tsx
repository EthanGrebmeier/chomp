import { navigation } from '@/lib/navigation';
import { router } from 'expo-router';
import { PlusIcon } from 'lucide-react-native';
import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
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
          servings: 4,
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
    <Button onPress={handleCreateRecipe} disabled={isPending}>
      <Icon
        as={PlusIcon}
        size={16}
        strokeWidth={3.5}
        color={theme.primaryForeground}
      />
      <Text>{isPending ? 'Creating...' : 'Create Recipe'}</Text>
    </Button>
  );
};
