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
    <BottomSheet
      name="delete-list-confirmation-sheet"
      ref={ref}
      footer={
        <View className="gap-2 px-10 pb-4">
          <Button size="lg" variant="destructive" onPress={onConfirm}>
            <Text>{confirmText}</Text>
          </Button>
          <Button size="lg" onPress={onCancel} variant="outline">
            <Text>Cancel</Text>
          </Button>
        </View>
      }
    >
      <BottomSheet.SheetView className="pb-24">
        <BottomSheet.Header title={title} />
        <View className="gap-4">
          <Text className="text-center text-muted-foreground">
            {description}
          </Text>
        </View>
      </BottomSheet.SheetView>
    </BottomSheet>
  );
};
