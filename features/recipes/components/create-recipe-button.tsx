import { router } from 'expo-router';
import { PlusIcon } from 'lucide-react-native';

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
    <DropdownMenuRoot
      trigger={
        <Button size="wide-small">
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
          <DropdownMenuItem onSelect={handleImportFromUrl} key="import-from-url">
            <DropdownMenuItemTitle>Import from URL</DropdownMenuItemTitle>
            <DropdownMenuItemIcon ios={{ name: 'link' }} />
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};
