import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';

import { BottomSheet } from '../../../components/bottom-sheet';
import { TextInput } from '../../../components/text-input';
import { Button } from '../../../components/ui/button';
import { CloseButton } from '../../../components/ui/close-button';
import { Text } from '../../../components/ui/text';
import { useUpdateGroceryListName } from '../../grocery-lists/instant/useUpdateGroceryListName';

export type EditListNameSheetRef = {
  present: (listId: string, currentName: string) => void;
  dismiss: () => void;
};

export const EditListNameSheet = forwardRef<EditListNameSheetRef, object>(
  (_, ref) => {
    const sheetRef = useRef<TrueSheet>(null);
    const [listName, setListName] = useState('');
    const [listId, setListId] = useState<string | null>(null);
    const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

    const updateGroceryListName = useUpdateGroceryListName();

    useImperativeHandle(ref, () => ({
      present: (id: string, currentName: string) => {
        setListId(id);
        setListName(currentName);
        sheetRef.current?.present();
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const handleSave = async () => {
      if (!listName.trim() || !listId) return;

      try {
        await updateGroceryListName(listId, listName.trim());
        sheetRef.current?.dismiss();
      } catch (error) {
        console.error('Failed to update list name:', error);
      }
    };

    const handleCancel = () => {
      sheetRef.current?.dismiss();
    };

    const handleDismiss = () => {
      KeyboardController.dismiss();
      setListName('');
      setListId(null);
    };

    return (
      <BottomSheet
        name="edit-list-name-sheet"
        ref={sheetRef}
        onStartClose={handleDismiss}
        footer={
          <View className="px-10 pb-4">
            <Button onPress={handleSave}>
              <Text>Save</Text>
            </Button>
          </View>
        }
      >
        <BottomSheet.SheetView className="pb-safe">
          <BottomSheet.Header
            title="Edit List Name"
            dismissButton={<CloseButton onPress={handleCancel} />}
          />

          <View className="my-4">
            <TextInput
              ref={inputRef}
              value={listName}
              onChangeText={setListName}
              placeholder="List name"
              placeholderTextColor="#9ca3af"
              className="h-12 rounded-xl border border-input bg-input px-4 text-base text-foreground"
              onSubmitEditing={handleSave}
              returnKeyType="done"
            />
          </View>
        </BottomSheet.SheetView>
      </BottomSheet>
    );
  }
);

EditListNameSheet.displayName = 'EditListNameSheet';
