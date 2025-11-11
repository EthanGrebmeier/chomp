import { MoreHorizontalIcon } from 'lucide-react-native';
import { Pressable } from 'react-native';
import * as DropdownMenu from 'zeego/dropdown-menu';

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
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Pressable className="p-2">
          <Icon as={MoreHorizontalIcon} size={24} color={theme.foreground} />
        </Pressable>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item onSelect={onViewRecipe} key="view-recipe">
          <DropdownMenu.ItemTitle>View Recipe</DropdownMenu.ItemTitle>
          <DropdownMenu.ItemIcon ios={{ name: 'eye' }} />
        </DropdownMenu.Item>
        <DropdownMenu.Item onSelect={onChangeRecipe} key="change-recipe">
          <DropdownMenu.ItemTitle>Change Recipe</DropdownMenu.ItemTitle>
          <DropdownMenu.ItemIcon ios={{ name: 'arrow.2.squarepath' }} />
        </DropdownMenu.Item>
        <DropdownMenu.Item onSelect={onRemove} destructive key="remove-recipe">
          <DropdownMenu.ItemTitle>
            Remove Recipe From Meal Plan
          </DropdownMenu.ItemTitle>
          <DropdownMenu.ItemIcon ios={{ name: 'trash' }} />
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

