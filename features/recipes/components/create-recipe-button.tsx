import { router } from 'expo-router';
import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';
import { useCreateRecipe } from '../hooks';

type CreateRecipeButtonProps = {
  onSuccess?: (result: { id: string }) => void;
};

export const CreateRecipeButton = ({ onSuccess }: CreateRecipeButtonProps) => {
  const { mutate: createRecipe, isPending } = useCreateRecipe();
  const handleCreateRecipe = () => {
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
          router.push(`/recipe/${result.id}?autofocus=true`);
          onSuccess?.(result);
        },
      }
    );
  };
  return (
    <Button onPress={handleCreateRecipe} disabled={isPending}>
      <Text>{isPending ? 'Creating...' : 'Create Recipe'}</Text>
    </Button>
  );
};
