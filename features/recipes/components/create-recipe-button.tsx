import { router } from 'expo-router';
import { PlusIcon } from 'lucide-react-native';
import { useRef } from 'react';

import { navigation } from '@/lib/navigation';

import { Button } from '../../../components/ui/button';
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '../../../components/ui/dropdown-menu';
import { Icon } from '../../../components/ui/icon';
import { useCreateRecipe } from '../hooks';

import { CreateRecipeSheet, CreateRecipeSheetRef } from './create-recipe-sheet';
import {
  ImportRecipeSheet,
  ImportRecipeSheetRef,
} from './import/import-recipe-sheet';

type CreateRecipeButtonProps = {
  onSuccess?: (result: { id: string }) => void;
};

export const CreateRecipeButton = ({
  onSuccess,
}: CreateRecipeButtonProps) => {
  const { mutate: createRecipe } = useCreateRecipe();
  const createSheetRef = useRef<CreateRecipeSheetRef>(null);
  const importSheetRef = useRef<ImportRecipeSheetRef>(null);

  const handleCreateRecipe = () => {
    createSheetRef.current?.present();
  };

  const handleImportFromUrl = () => {
    importSheetRef.current?.present();
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

  const handleImportSuccess = (recipeId: string) => {
    router.push(navigation.goToRecipe(recipeId));
    onSuccess?.({ id: recipeId });
  };

  return (
    <>
      <DropdownMenuRoot
        trigger={
          <Button size="iconLg">
            <Icon
              strokeWidth={3}
              className="text-primary-foreground"
              as={PlusIcon}
              size={28}
            />
          </Button>
        }
      >
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={handleCreateRecipe} key="create-recipe">
              <DropdownMenuItemTitle>Create Recipe</DropdownMenuItemTitle>
              <DropdownMenuItemIcon ios={{ name: 'plus' }} />
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={handleImportFromUrl}
              key="import-from-url"
            >
              <DropdownMenuItemTitle>Import from URL</DropdownMenuItemTitle>
              <DropdownMenuItemIcon ios={{ name: 'link' }} />
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenuRoot>
      <CreateRecipeSheet ref={createSheetRef} onSubmit={handleSubmit} />
      <ImportRecipeSheet
        ref={importSheetRef}
        onImportSuccess={handleImportSuccess}
      />
    </>
  );
};
