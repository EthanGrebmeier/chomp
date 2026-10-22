import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { cn } from '@/lib/utils';

import { BottomSheet } from '../../../components/bottom-sheet';
import { TextInput } from '../../../components/text-input';
import { Button } from '../../../components/ui/button';
import { CloseButton } from '../../../components/ui/close-button';
import { Text } from '../../../components/ui/text';
import { useUncontrolledTextInput } from '../../../components/use-uncontrolled-text-input';
import { useCreateGroceryList } from '../instant/useCreateGroceryList';

export type CreateGroceryListSheetRef = {
  present: () => void;
  dismiss: () => void;
};

type CreateGroceryListSheetProps = {
  onCreated: (listId: string) => void;
};

const MAX_LIST_NAME_LENGTH = 20;

export const CreateGroceryListSheet = forwardRef<
  CreateGroceryListSheetRef,
  CreateGroceryListSheetProps
>(({ onCreated }, ref) => {
  const sheetRef = useRef<TrueSheet>(null);
  const listNameInput = useUncontrolledTextInput();
  const [listNameMeta, setListNameMeta] = useState({
    length: 0,
    hasText: false,
  });
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const createGroceryList = useCreateGroceryList();

  useImperativeHandle(ref, () => ({
    present: () => {
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const handleCreateList = async () => {
    const newListName = listNameInput.getValue();
    const trimmedListName = newListName.trim();
    if (!trimmedListName) return;

    if (newListName.length > MAX_LIST_NAME_LENGTH) {
      return;
    }

    const result = await createGroceryList(trimmedListName);
    listNameInput.reset();
    setListNameMeta({ length: 0, hasText: false });
    sheetRef.current?.dismiss();
    onCreated(result.listId);
  };

  const handleListNameChange = (text: string) => {
    listNameInput.handleChangeText(text);
    setListNameMeta({
      length: text.length,
      hasText: text.trim().length > 0,
    });
  };

  const handleCancel = () => {
    listNameInput.reset();
    setListNameMeta({ length: 0, hasText: false });
    sheetRef.current?.dismiss();
  };

  const showLimit = listNameMeta.length > MAX_LIST_NAME_LENGTH - 8;
  const overLimit = listNameMeta.length > MAX_LIST_NAME_LENGTH;

  return (
    <BottomSheet
      name="create-grocery-list-sheet"
      ref={sheetRef}
      onOpen={() => {
        inputRef.current?.focus();
      }}
      onStartClose={() => {
        KeyboardController.dismiss();
        listNameInput.reset();
        setListNameMeta({ length: 0, hasText: false });
      }}
      footer={
        <View className="pb-safe px-6">
          <Button
            onPress={handleCreateList}
            disabled={overLimit || !listNameMeta.hasText}
          >
            <Text>Create List</Text>
          </Button>
        </View>
      }
    >
      <BottomSheet.SheetView className="pb-safe">
        <BottomSheet.Header
          title="Name your list"
          dismissButton={<CloseButton onPress={handleCancel} />}
        />

        <View className="my-4 gap-2 pb-4">
          <View className="flex-row items-center justify-between gap-2">
            <Text variant="label" className="text-muted-foreground">
              List name
            </Text>
            {showLimit && (
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
              >
                <Text
                  variant="caption"
                  tabularNumbers
                  className={cn(overLimit && 'text-red-500')}
                >
                  {listNameMeta.length} / {MAX_LIST_NAME_LENGTH}
                </Text>
              </Animated.View>
            )}
          </View>
          <TextInput
            key={listNameInput.inputKey}
            ref={inputRef}
            defaultValue={listNameInput.defaultValue}
            onChangeText={handleListNameChange}
            placeholder="My Grocery List"
            placeholderTextColor="#9ca3af"
            className="h-12 rounded-xl border border-input bg-input px-4 text-base leading-5 text-foreground"
            onSubmitEditing={handleCreateList}
            returnKeyType="done"
          />
        </View>
      </BottomSheet.SheetView>
    </BottomSheet>
  );
});

CreateGroceryListSheet.displayName = 'CreateGroceryListSheet';
