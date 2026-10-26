import { router } from 'expo-router';

import { navigation } from '@/lib/navigation';

import { AddButton } from '../../../components/ui/add-button';
import { Button } from '../../../components/ui/button';
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '../../../components/ui/dropdown-menu';
import { Text } from '../../../components/ui/text';

type CreateRecipeButtonProps = {
  listId?: string;
  label?: string;
};

export const CreateRecipeButton = ({
  listId,
  label,
}: CreateRecipeButtonProps) => {
  const handleCreateRecipe = () => {
    router.push(navigation.goToCreateRecipeManual(listId));
  };

  const handleImportFromUrl = () => {
    router.push(navigation.goToCreateRecipeImport(listId));
  };

  return (
    <DropdownMenuRoot
      trigger={
        label ? (
          <Button>
            <Text>{label}</Text>
          </Button>
        ) : (
          <AddButton accessibilityLabel="Add recipe" />
        )
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
  );
};
