import { Trash2Icon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { toast } from 'sonner-native';

import { removeSavedItem } from '../../features/saved-items/instant/remove-saved-item';
import { deleteLocalItem } from '../../features/saved-items/local/delete-local-item';
import { cn } from '../../lib/utils';
import { WithLayoutTransition } from '../animated/with-layout-transition';
import { HapticPressable } from '../ui/haptic-pressable';
import { Icon } from '../ui/icon';
import { Pill } from '../ui/pill';

import {
  DeleteSavedItemSheet,
  DeleteSavedItemSheetRef,
} from './delete-saved-item-sheet';
import { useItemSheet } from './use-item-sheet';

type DeleteSavedItemButtonProps = {
  disabled?: boolean;
};

/**
 * Metabar action shown when the item being added is linked to an existing
 * saved item. Opens a confirmation sheet, then deletes the saved item and
 * clears the link so the metabar reverts to the "Save item" toggle.
 */
export const DeleteSavedItemButton = ({
  disabled = false,
}: DeleteSavedItemButtonProps) => {
  const { selectedItem, setSelectedItem, getItemInputValue } = useItemSheet();
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteSheetRef = useRef<DeleteSavedItemSheetRef>(null);

  const cloudSavedItemId =
    selectedItem?.source === 'cloud'
      ? selectedItem.cloudSavedItemId
      : undefined;
  const localSavedItemId =
    selectedItem?.source === 'local'
      ? selectedItem.localSavedItemId
      : undefined;

  if (!cloudSavedItemId && !localSavedItemId) {
    return null;
  }

  const trimmedInputName = getItemInputValue().trim();
  const trimmedSelectedName = selectedItem?.name?.trim() ?? '';
  const itemName = trimmedInputName || trimmedSelectedName || 'Item';

  const handleConfirmDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      if (cloudSavedItemId) {
        await removeSavedItem({ itemId: cloudSavedItemId });
      } else if (localSavedItemId) {
        await deleteLocalItem({
          itemId: localSavedItemId,
          allowDefault:
            selectedItem?.source === 'local' && selectedItem.isDefault,
        });
      }
      // Drop the link so the metabar reverts to the "Save item" toggle and
      // the add flow no longer treats this as a linked item.
      setSelectedItem(null);
      deleteSheetRef.current?.dismiss();
      toast.success('Saved item deleted');
    } catch {
      toast.error('Failed to delete saved item');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <WithLayoutTransition>
        <HapticPressable
          accessibilityRole="button"
          accessibilityLabel="Delete saved item"
          onPress={() => deleteSheetRef.current?.present()}
          hapticType="light"
          disabled={disabled}
        >
          <Pill
            className={cn('border-destructive', disabled && 'opacity-50')}
            icon={
              <Icon as={Trash2Icon} size={16} className="text-destructive" />
            }
            textClassName="font-semibold text-destructive"
            hasValue
          >
            Delete Saved Item
          </Pill>
        </HapticPressable>
      </WithLayoutTransition>
      <DeleteSavedItemSheet
        ref={deleteSheetRef}
        itemName={itemName}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        onCancel={() => deleteSheetRef.current?.dismiss()}
        isPending={isDeleting}
      />
    </>
  );
};
