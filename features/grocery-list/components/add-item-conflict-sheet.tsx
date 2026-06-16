import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export type AddItemConflictSheetProps = {
  ref: React.RefObject<TrueSheet | null>;
  onIncrement: () => void;
  onCreateSeparate: () => void;
  onCancel: () => void;
};

export const AddItemConflictSheet = ({
  ref,
  onIncrement,
  onCreateSeparate,
  onCancel,
}: AddItemConflictSheetProps) => {
  return (
    <BottomSheet
      name="add-item-conflict-sheet"
      ref={ref}
      footer={
        <View className="px-10 pb-4">
          <Button size="lg" variant="default" onPress={onIncrement}>
            <Text>Increment Quantities</Text>
          </Button>
        </View>
      }
    >
      <BottomSheet.SheetView className="pb-safe">
        <BottomSheet.Header title="Item Already Exists" />
        <View className="gap-4">
          <Text className="text-muted-foreground">
            This item already exists in the list. What would you like to do?
          </Text>
          <View className="gap-2">
            <Button size="lg" variant="outline" onPress={onCreateSeparate}>
              <Text>Create Separate Items</Text>
            </Button>
            <Button size="lg" onPress={onCancel} variant="ghost">
              <Text>Cancel</Text>
            </Button>
          </View>
        </View>
      </BottomSheet.SheetView>
    </BottomSheet>
  );
};
