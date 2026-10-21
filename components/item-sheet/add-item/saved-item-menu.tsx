import { EllipsisIcon } from 'lucide-react-native';
import { View } from 'react-native';

import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from '../../native-dropdown';
import { Icon } from '../../ui/icon';
import { DeleteSavedItemButton } from '../delete-saved-item-button';
import { useItemSheet } from '../use-item-sheet';

const SavedItemMenuTrigger = ({ onPress }: { onPress: () => void }) => {
  const { saveItem, setSaveItem, hasItemTitle } = useItemSheet();

  return (
    <DropdownMenuRoot>
      <DropdownMenuTrigger>
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel="Saved item options"
          className="size-11 items-center justify-center"
        >
          <Icon as={EllipsisIcon} size={22} className="text-muted-foreground" />
        </View>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuCheckboxItem
          key="sync"
          value={saveItem ? 'on' : 'off'}
          onValueChange={() => setSaveItem(!saveItem)}
          disabled={!hasItemTitle}
        >
          <DropdownMenuItemTitle>Sync changes</DropdownMenuItemTitle>
        </DropdownMenuCheckboxItem>
        <DropdownMenuItem
          key="delete"
          destructive
          disabled={!hasItemTitle}
          onSelect={onPress}
        >
          <DropdownMenuItemTitle>Delete saved item</DropdownMenuItemTitle>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
};

export const SavedItemMenu = () => (
  <DeleteSavedItemButton Trigger={SavedItemMenuTrigger} />
);
