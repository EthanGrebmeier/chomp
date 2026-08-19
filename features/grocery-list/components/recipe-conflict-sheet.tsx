import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';

import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

import { BackButton } from '../../../components/ui/back-button';

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
          <View className="gap-2 px-10 pb-2">
            <Button
              variant="default"
              size="lg"
              onPress={onIncrement}
              disabled={isPending}
            >
              <Text>Increment Quantities</Text>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onPress={onCreateSeparate}
              disabled={isPending}
            >
              <Text>Create Separate Items</Text>
            </Button>
          </View>
        }
      >
        <BottomSheet.SheetView className="pb-safe-offset-12">
          <BottomSheet.Header
            title="Choose how to add ingredients"
            description={`Some ingredients from "${recipeName}" match items already on this list.`}
            dismissButton={<BackButton onPress={handleClose} />}
          />
        </BottomSheet.SheetView>
      </BottomSheet>
    );
  }
);

RecipeConflictSheet.displayName = 'RecipeConflictSheet';
