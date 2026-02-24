import { Button } from '@/components/ui/button';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import { BottomSheet } from '../../../components/bottom-sheet';
import { Text } from '../../../components/ui/text';

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
    const bottomSheetRef = useRef<TrueSheet>(null);

    useImperativeHandle(ref, () => ({
      present: () => bottomSheetRef.current?.present(),
      dismiss: () => bottomSheetRef.current?.dismiss(),
    }));

    const handleClose = () => {
      KeyboardController.dismiss();
      onCancel();
    };

    return (
      <BottomSheet
        name="recipe-conflict-sheet"
        ref={bottomSheetRef}
        footer={
          <View className="px-10 pb-4">
            <Button onPress={onIncrement} disabled={isPending}>
              <Text>Increment Quantities</Text>
            </Button>
          </View>
        }
      >
        <BottomSheet.SheetView className="pb-safe">
          <BottomSheet.Header title={`"${recipeName}" Has Similar Items`} />
          <View className="gap-4">
            <Text className="text-muted-foreground">
              Some ingredients already exist with the same name, but different
              metadata. What would you like to do?
            </Text>

            <View className="gap-2">
              <Button
                onPress={onCreateSeparate}
                disabled={isPending}
                variant="outline"
                className="w-full"
              >
                <Text>Create Separate Items</Text>
              </Button>

              <Button
                onPress={handleClose}
                disabled={isPending}
                variant="ghost"
                className="w-full"
              >
                <Text>Cancel</Text>
              </Button>
            </View>
          </View>
        </BottomSheet.SheetView>
      </BottomSheet>
    );
  }
);
