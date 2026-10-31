import { MetabarMenuTrigger } from '@/components/ui/metabar-menu-trigger';

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '../../../components/ui/dropdown-menu';

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
  return (
    <DropdownMenuRoot
      trigger={<MetabarMenuTrigger accessibilityLabel="Meal recipe actions" />}
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
