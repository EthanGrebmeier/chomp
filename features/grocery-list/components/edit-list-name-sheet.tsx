import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';

import { SheetFooter } from '@/components/sheet-content';
import { BottomActionButton } from '@/components/ui/bottom-action-button';

import { BottomSheet } from '../../../components/bottom-sheet';
import { TextInput } from '../../../components/text-input';
import { CloseButton } from '../../../components/ui/close-button';
import { Text } from '../../../components/ui/text';
import { useUncontrolledTextInput } from '../../../components/use-uncontrolled-text-input';
import { useUpdateGroceryListName } from '../../grocery-lists/instant/useUpdateGroceryListName';

export type EditListNameSheetRef = {
  present: (listId: string, currentName: string) => void;
  dismiss: () => void;
};

export const EditListNameSheet = forwardRef<EditListNameSheetRef, object>(
  (_, ref) => {
    const sheetRef = useRef<TrueSheet>(null);
    const listNameInput = useUncontrolledTextInput();
    const [canSave, setCanSave] = useState(false);
    const [listId, setListId] = useState<string | null>(null);
    const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

    const updateGroceryListName = useUpdateGroceryListName();

    useImperativeHandle(ref, () => ({
      present: (id: string, currentName: string) => {
        setListId(id);
        listNameInput.reset(currentName);
        setCanSave(currentName.trim().length > 0);
        sheetRef.current?.present();
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const handleSave = async () => {
      const trimmedListName = listNameInput.getValue().trim();
      if (!trimmedListName || !listId) return;

      try {
        await updateGroceryListName(listId, trimmedListName);
        sheetRef.current?.dismiss();
      } catch (error) {
        console.error('Failed to update list name:', error);
      }
    };

    const handleChangeText = (text: string) => {
      listNameInput.handleChangeText(text);
      setCanSave(text.trim().length > 0);
    };

    const handleCancel = () => {
      sheetRef.current?.dismiss();
    };

    const handleDismiss = () => {
      KeyboardController.dismiss();
      listNameInput.reset();
      setCanSave(false);
      setListId(null);
    };

    return (
      <BottomSheet
        name="edit-list-name-sheet"
        ref={sheetRef}
        onStartClose={handleDismiss}
        footer={
          <SheetFooter>
            <BottomActionButton onPress={handleSave} disabled={!canSave}>
              <Text>Save</Text>
            </BottomActionButton>
          </SheetFooter>
        }
      >
        <BottomSheet.SheetView>
          <BottomSheet.Header
            title="Rename list"
            backAction={<CloseButton onPress={handleCancel} />}
          />

          <View className="">
            <TextInput
              key={listNameInput.inputKey}
              ref={inputRef}
              defaultValue={listNameInput.defaultValue}
              onChangeText={handleChangeText}
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
