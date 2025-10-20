import { MoreHorizontalIcon } from 'lucide-react-native';
import { Pressable } from 'react-native';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '../../../components/native-dropdown';
import { Icon } from '../../../components/ui/icon';
import { useTheme } from '../../../hooks/use-theme';

type MealPlanDropdownProps = {
  onEdit: () => void;
};

export const MealPlanDropdown = ({ onEdit }: MealPlanDropdownProps) => {
  const theme = useTheme();
  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger>
        <Pressable>
          <Icon as={MoreHorizontalIcon} size={24} color={theme.primary} />
        </Pressable>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={onEdit} key="edit">
          <DropdownMenuItemTitle children="Edit" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};
