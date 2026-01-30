import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export type ClearListConfirmationSheetProps = {
  ref: React.RefObject<TrueSheet | null>;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ClearListConfirmationSheet = ({
  ref,
  onConfirm,
  onCancel,
}: ClearListConfirmationSheetProps) => {
  const handleConfirm = () => {
    onConfirm();
    ref.current?.dismiss();
  };

  return (
    <BottomSheet
      name="clear-list-confirmation-sheet"
      ref={ref}
      footer={
        <View className="px-10 pb-4">
          <Button variant="destructive" onPress={handleConfirm}>
            <Text>Clear List</Text>
          </Button>
        </View>
      }
    >
      <BottomSheet.SheetView className="pb-safe">
        <BottomSheet.Header title="Clear Grocery List" />
        <View className="gap-6">
          <Text className="text-center text-muted-foreground">
            Are you sure you want to clear your entire grocery list? This action
            cannot be undone.
          </Text>
          <View className="gap-2">
            <Button onPress={onCancel} variant="outline">
              <Text>Cancel</Text>
            </Button>
          </View>
        </View>
      </BottomSheet.SheetView>
    </BottomSheet>
  );
};
