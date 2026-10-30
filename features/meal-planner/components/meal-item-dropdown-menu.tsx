import { HeaderMenuTrigger } from '@/components/ui/header-action';

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '../../../components/ui/dropdown-menu';

type MealItemDropdownMenuProps = {
  itemName: string;
  onRemove: () => void;
};

export const MealItemDropdownMenu = ({
  itemName,
  onRemove,
}: MealItemDropdownMenuProps) => {
  return (
    <DropdownMenuRoot
      trigger={<HeaderMenuTrigger accessibilityLabel="Meal item actions" />}
    >
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={onRemove} destructive key="remove-item">
          <DropdownMenuItemTitle>Delete Item</DropdownMenuItemTitle>
          <DropdownMenuItemIcon ios={{ name: 'trash' }} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};
