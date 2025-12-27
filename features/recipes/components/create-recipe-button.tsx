import { router } from 'expo-router';
import { PlusIcon } from 'lucide-react-native';
import { useRef } from 'react';

import { navigation } from '@/lib/navigation';

import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
import { useCreateRecipe } from '../hooks';

import { CreateRecipeSheet, CreateRecipeSheetRef } from './create-recipe-sheet';

type CreateRecipeButtonProps = {
  onSuccess?: (result: { id: string }) => void;
  onPress?: () => void;
};

export const CreateRecipeButton = ({
  onSuccess,
  onPress: onPressProp,
}: CreateRecipeButtonProps) => {
  const { mutate: createRecipe } = useCreateRecipe();
  const sheetRef = useRef<CreateRecipeSheetRef>(null);

  const handleOpenSheet = () => {
    onPressProp?.();
    sheetRef.current?.present();
  };

  const handleSubmit = (data: { name: string }) => {
    createRecipe(
      {
        recipe: {
          name: data.name,
          description: '',
        },
        ingredients: [],
      },
      {
        onSuccess: result => {
          router.push(navigation.goToRecipe(result.id));
          onSuccess?.(result);
        },
      }
    );
  };

  return (
    <>
      <Button size="iconLg" onPress={handleOpenSheet}>
        <Icon
          strokeWidth={3}
          className="text-primary-foreground"
          as={PlusIcon}
          size={28}
        />
      </Button>
      <CreateRecipeSheet ref={sheetRef} onSubmit={handleSubmit} />
    </>
  );
};
