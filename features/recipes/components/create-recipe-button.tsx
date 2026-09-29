import { router } from 'expo-router';

import { navigation } from '@/lib/navigation';

import { AddButton } from '../../../components/ui/add-button';
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '../../../components/ui/dropdown-menu';

type CreateRecipeButtonProps = {
  listId?: string;
};

export const CreateRecipeButton = ({ listId }: CreateRecipeButtonProps) => {
  const handleCreateRecipe = () => {
    router.push(navigation.goToCreateRecipeManual(listId));
  };

  const handleImportFromUrl = () => {
    router.push(navigation.goToCreateRecipeImport(listId));
  };

  return (
    <DropdownMenuRoot trigger={<AddButton accessibilityLabel="Add recipe" />}>
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
