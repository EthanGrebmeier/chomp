import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';

import { BottomSheet } from '../bottom-sheet';
import { Button } from '../ui/button';
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
        <View className="gap-2 px-10 pb-2">
          <Button
            variant="destructive"
            size="lg"
            onPress={onConfirm}
            disabled={isPending}
          >
            <Text className="text-white">Delete Saved Item</Text>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onPress={handleClose}
            disabled={isPending}
          >
            <Text>Cancel</Text>
          </Button>
        </View>
      }
    >
      <BottomSheet.SheetView className="pb-safe-offset-12">
        <BottomSheet.Header
          title="Delete saved item?"
          description={`"${itemName}" will be removed from your saved items. This won't affect items already on your lists.`}
        />
      </BottomSheet.SheetView>
    </BottomSheet>
  );
});

DeleteSavedItemSheet.displayName = 'DeleteSavedItemSheet';
