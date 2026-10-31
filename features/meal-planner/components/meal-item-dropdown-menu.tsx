import { MetabarMenuTrigger } from '@/components/ui/metabar-menu-trigger';

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
      trigger={<MetabarMenuTrigger accessibilityLabel="Meal item actions" />}
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
