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

type MealItemDropdownMenuProps = {
  itemName: string;
  onRemove: () => void;
};

export const MealItemDropdownMenu = ({
  itemName,
  onRemove,
}: MealItemDropdownMenuProps) => {
  const theme = useTheme();

  return (
    <DropdownMenuRoot
      trigger={<Icon as={MoreHorizontalIcon} size={24} color={theme.foreground} />}
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

