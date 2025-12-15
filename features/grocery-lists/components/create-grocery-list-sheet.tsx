import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';

import { BottomSheet } from '../../../components/bottom-sheet';
import { TextInput } from '../../../components/text-input';
import { CloseButton } from '../../../components/ui/close-button';
import { useCreateGroceryList } from '../instant/useCreateGroceryList';

export type CreateGroceryListSheetRef = {
  present: () => void;
  dismiss: () => void;
};

type CreateGroceryListSheetProps = {
  onCreated: (listId: string) => void;
};

export const CreateGroceryListSheet = forwardRef<
  CreateGroceryListSheetRef,
  CreateGroceryListSheetProps
>(({ onCreated }, ref) => {
  const sheetRef = useRef<TrueSheet>(null);
  const [newListName, setNewListName] = useState('');
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const createGroceryList = useCreateGroceryList();

  useImperativeHandle(ref, () => ({
    present: () => {
      sheetRef.current?.present();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    const result = await createGroceryList(newListName.trim());
    setNewListName('');
    sheetRef.current?.dismiss();
    onCreated(result.listId);
  };

  const handleCancel = () => {
    setNewListName('');
    sheetRef.current?.dismiss();
  };

  return (
    <BottomSheet
      name="create-grocery-list-sheet"
      ref={sheetRef}
      onStartClose={() => {
        KeyboardController.dismiss();
        setNewListName('');
      }}
    >
      <BottomSheet.SheetView>
        <BottomSheet.Header
          title="Create New List"
          button={<CloseButton onPress={handleCancel} />}
        />

        <View className="my-4">
          <TextInput
            ref={inputRef}
            value={newListName}
            onChangeText={setNewListName}
            placeholder="List name"
            placeholderTextColor="#9ca3af"
            className="h-12 rounded-xl border border-input bg-input px-4 text-base text-foreground"
            onSubmitEditing={handleCreateList}
            returnKeyType="done"
          />
        </View>
      </BottomSheet.SheetView>
    </BottomSheet>
  );
});

CreateGroceryListSheet.displayName = 'CreateGroceryListSheet';
