import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { KeyboardController } from 'react-native-keyboard-controller';

import { BottomSheet } from '@/components/bottom-sheet';
import { SheetFooter } from '@/components/sheet-content';
import { BottomActionButton } from '@/components/ui/bottom-action-button';
import { Text } from '@/components/ui/text';

import { CloseButton } from '../../../components/ui/close-button';

export type RecipeConflictSheetRef = {
  present: () => void;
  dismiss: () => void;
};

type RecipeConflictSheetProps = {
  recipeName: string;
  onIncrement: () => void;
  onCreateSeparate: () => void;
  onCancel: () => void;
  isPending?: boolean;
};

export const RecipeConflictSheet = forwardRef<
  RecipeConflictSheetRef,
  RecipeConflictSheetProps
>(
  (
    { recipeName, onIncrement, onCreateSeparate, onCancel, isPending = false },
    ref
  ) => {
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
        name="recipe-conflict-sheet"
        ref={sheetRef}
        footer={
          <SheetFooter className="gap-2">
            <BottomActionButton
              variant="default"
              onPress={onIncrement}
              disabled={isPending}
            >
              <Text>Increment Quantities</Text>
            </BottomActionButton>
            <BottomActionButton
              variant="outline"
              onPress={onCreateSeparate}
              disabled={isPending}
            >
              <Text>Create Separate Items</Text>
            </BottomActionButton>
          </SheetFooter>
        }
      >
        <BottomSheet.SheetView>
          <BottomSheet.Header
            title="Choose how to add ingredients"
            subtitle={`Some ingredients from "${recipeName}" match items already on this list.`}
            closeAction={<CloseButton onPress={handleClose} />}
          />
        </BottomSheet.SheetView>
      </BottomSheet>
    );
  }
);

RecipeConflictSheet.displayName = 'RecipeConflictSheet';
