import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export type DeleteListConfirmationSheetProps = {
  ref: React.RefObject<TrueSheet | null>;
  isOwner: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const DeleteListConfirmationSheet = ({
  ref,
  isOwner,
  onConfirm,
  onCancel,
}: DeleteListConfirmationSheetProps) => {
  const title = isOwner ? 'Delete List' : 'Leave List';
  const description = isOwner
    ? 'Are you sure you want to delete this list? All items will be permanently removed and this action cannot be undone.'
    : 'Are you sure you want to leave this list? You will no longer have access to it.';
  const confirmText = isOwner ? 'Delete List' : 'Leave List';

  return (
    <BottomSheet name="delete-list-confirmation-sheet" ref={ref}>
      <BottomSheet.SheetView>
        <BottomSheet.Header title={title} />
        <View className="gap-4">
          <Text className="text-muted-foreground">{description}</Text>
          <View className="gap-2">
            <Button variant="destructive" onPress={onConfirm}>
              <Text>{confirmText}</Text>
            </Button>
            <Button onPress={onCancel} variant="outline">
              <Text>Cancel</Text>
            </Button>
          </View>
        </View>
      </BottomSheet.SheetView>
    </BottomSheet>
  );
};

