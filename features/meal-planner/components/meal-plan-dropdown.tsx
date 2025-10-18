import { MoreHorizontalIcon } from 'lucide-react-native';
import { Pressable } from 'react-native';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '../../../components/native-dropdown';
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
          <MoreHorizontalIcon size={24} color={theme.primary} />
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
