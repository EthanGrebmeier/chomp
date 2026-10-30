import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { KeyboardController } from 'react-native-keyboard-controller';

import { SheetFooter } from '@/components/sheet-content';
import { BottomActionButton } from '@/components/ui/bottom-action-button';
import { CloseButton } from '@/components/ui/close-button';

import { BottomSheet } from '../bottom-sheet';
import { Text } from '../ui/text';

export type DeleteSavedItemSheetRef = {
  present: () => void;
  dismiss: () => void;
};

type DeleteSavedItemSheetProps = {
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
};

export const DeleteSavedItemSheet = forwardRef<
  DeleteSavedItemSheetRef,
  DeleteSavedItemSheetProps
>(({ itemName, onConfirm, onCancel, isPending = false }, ref) => {
  const sheetRef = useRef<TrueSheet>(null);

  useImperativeHandle(ref, () => ({
    present: () => sheetRef.current?.present(),
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const handleClose = () => {
    KeyboardController.dismiss();
    onCancel();
  };

  return (
    <BottomSheet
      name="delete-saved-item-sheet"
      ref={sheetRef}
      footer={
        <SheetFooter className="gap-2">
          <BottomActionButton
            variant="destructive"
            onPress={onConfirm}
            disabled={isPending}
          >
            <Text className="text-white">Delete Saved Item</Text>
          </BottomActionButton>
          <BottomActionButton
            variant="outline"
            onPress={handleClose}
            disabled={isPending}
          >
            <Text>Cancel</Text>
          </BottomActionButton>
        </SheetFooter>
      }
    >
      <BottomSheet.SheetView>
        <BottomSheet.Header
          title="Delete saved item?"
          backAction={
            <CloseButton onPress={handleClose} disabled={isPending} />
          }
          subtitle={`"${itemName}" will be removed from your saved items. This won't affect items already on your lists.`}
        />
      </BottomSheet.SheetView>
    </BottomSheet>
  );
});

DeleteSavedItemSheet.displayName = 'DeleteSavedItemSheet';
