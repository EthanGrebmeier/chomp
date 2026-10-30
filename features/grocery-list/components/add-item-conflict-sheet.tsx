import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { SheetFooter } from '@/components/sheet-content';
import { BottomActionButton } from '@/components/ui/bottom-action-button';
import { CloseButton } from '@/components/ui/close-button';
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
        <SheetFooter>
          <BottomActionButton variant="default" onPress={onIncrement}>
            <Text>Increment Quantities</Text>
          </BottomActionButton>
        </SheetFooter>
      }
    >
      <BottomSheet.SheetView>
        <BottomSheet.Header
          title="Choose how to add this item"
          backAction={<CloseButton onPress={onCancel} />}
          subtitle="This item is already in the list. Increment its quantities or create a separate item."
        />
        <View className="gap-2">
          <BottomActionButton variant="outline" onPress={onCreateSeparate}>
            <Text>Create Separate Items</Text>
          </BottomActionButton>
          <BottomActionButton onPress={onCancel} variant="ghost">
            <Text>Cancel</Text>
          </BottomActionButton>
        </View>
      </BottomSheet.SheetView>
    </BottomSheet>
  );
};
