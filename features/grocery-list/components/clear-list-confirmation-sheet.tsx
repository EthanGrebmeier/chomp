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
    <BottomSheet name="clear-list-confirmation-sheet" ref={ref}>
      <BottomSheet.Header title="Clear Grocery List" />
      <View className="gap-4">
        <Text className="text-muted-foreground">
          Are you sure you want to clear your entire grocery list? This action
          cannot be undone.
        </Text>
        <View className="gap-2">
          <Button variant="destructive" onPress={handleConfirm}>
            <Text>Clear List</Text>
          </Button>
          <Button onPress={onCancel} variant="outline">
            <Text>Cancel</Text>
          </Button>
        </View>
      </View>
    </BottomSheet>
  );
};
