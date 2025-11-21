import { MoreHorizontalIcon } from 'lucide-react-native';

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '../../../components/ui/dropdown-menu';
import { Icon } from '../../../components/ui/icon';
import { useTheme } from '../../../hooks/use-theme';

type MealSheetRecipeDropdownProps = {
  recipeId: string;
  recipeName: string;
  onRemove: () => void;
  onViewRecipe: () => void;
  onChangeRecipe: () => void;
};

export const MealSheetRecipeDropdown = ({
  recipeId,
  recipeName,
  onRemove,
  onViewRecipe,
  onChangeRecipe,
}: MealSheetRecipeDropdownProps) => {
  const theme = useTheme();

  return (
    <DropdownMenuRoot
      trigger={<Icon as={MoreHorizontalIcon} size={24} color={theme.foreground} />}
    >
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={onViewRecipe} key="view-recipe">
          <DropdownMenuItemTitle>View Recipe</DropdownMenuItemTitle>
          <DropdownMenuItemIcon ios={{ name: 'eye' }} />
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onChangeRecipe} key="change-recipe">
          <DropdownMenuItemTitle>Change Recipe</DropdownMenuItemTitle>
          <DropdownMenuItemIcon ios={{ name: 'arrow.2.squarepath' }} />
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onRemove} destructive key="remove-recipe">
          <DropdownMenuItemTitle>
            Remove Recipe From Meal Plan
          </DropdownMenuItemTitle>
          <DropdownMenuItemIcon ios={{ name: 'trash' }} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};
