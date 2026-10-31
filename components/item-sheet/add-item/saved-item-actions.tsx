import { toast } from 'sonner-native';

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '../../ui/dropdown-menu';
import { MetabarMenuTrigger } from '../../ui/metabar-menu-trigger';
import { DeleteSavedItemButton } from '../delete-saved-item-button';
import { hasSavedItemLink } from '../saved-item-intent';
import { useItemSheet } from '../use-item-sheet';

/** Leading metabar chip; its filled state indicates saving/syncing is enabled. */
function SavedItemMenu({ onPress }: { onPress?: () => void }) {
  const { saveItem, setSaveItem, hasItemTitle, selectedItem } = useItemSheet();
  const isSync = hasSavedItemLink(selectedItem);
  const toggleSave = () => {
    const next = !saveItem;
    setSaveItem(next);
    if (next)
      toast(isSync ? 'Updates will be saved' : 'This item will be saved');
  };
  return (
    <DropdownMenuRoot
      trigger={
        <MetabarMenuTrigger
          active={saveItem}
          accessibilityLabel={`Saved item actions, ${isSync ? 'sync' : 'save'} ${saveItem ? 'on' : 'off'}`}
        />
      }
    >
      <DropdownMenuContent>
        <DropdownMenuItem
          key="save"
          disabled={!hasItemTitle}
          onSelect={toggleSave}
        >
          <DropdownMenuItemTitle>
            {isSync
              ? saveItem
                ? 'Stop syncing changes'
                : 'Sync changes'
              : saveItem
                ? 'Don’t save item'
                : 'Save item'}
          </DropdownMenuItemTitle>
          <DropdownMenuItemIcon
            ios={{ name: isSync ? 'arrow.triangle.2.circlepath' : 'bookmark' }}
          />
        </DropdownMenuItem>
        {onPress ? (
          <DropdownMenuItem
            key="delete"
            destructive
            disabled={!hasItemTitle}
            onSelect={onPress}
          >
            <DropdownMenuItemTitle>Delete saved item</DropdownMenuItemTitle>
            <DropdownMenuItemIcon ios={{ name: 'trash' }} />
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenuRoot>
  );
}

export function SavedItemActions() {
  const { selectedItem } = useItemSheet();
  return hasSavedItemLink(selectedItem) ? (
    <DeleteSavedItemButton Trigger={SavedItemMenu} />
  ) : (
    <SavedItemMenu />
  );
}
