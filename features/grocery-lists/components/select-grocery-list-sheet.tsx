import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { CheckIcon, PlusIcon } from 'lucide-react-native';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';

import { BottomSheet } from '../../../components/bottom-sheet';
import { Button } from '../../../components/ui/button';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { useCreateGroceryList } from '../instant/useCreateGroceryList';
import { useGroceryLists } from '../instant/useGroceryLists';

export type SelectGroceryListSheetRef = {
  present: () => void;
  dismiss: () => void;
};

type SelectGroceryListSheetProps = {
  selectedListId: string | null;
  onSelectList: (listId: string) => void;
};

export const SelectGroceryListSheet = forwardRef<
  SelectGroceryListSheetRef,
  SelectGroceryListSheetProps
>(({ selectedListId, onSelectList }, ref) => {
  const sheetRef = useRef<TrueSheet>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const inputRef = useRef<TextInput>(null);

  const { data: lists } = useGroceryLists();
  const createGroceryList = useCreateGroceryList();

  useImperativeHandle(ref, () => ({
    present: () => sheetRef.current?.present(),
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const handleSelectList = (listId: string) => {
    onSelectList(listId);
    sheetRef.current?.dismiss();
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    const result = await createGroceryList(newListName.trim());
    onSelectList(result.clientId);
    setNewListName('');
    setIsCreating(false);
    sheetRef.current?.dismiss();
  };

  const handleStartCreating = () => {
    setIsCreating(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleCancelCreating = () => {
    setIsCreating(false);
    setNewListName('');
    KeyboardController.dismiss();
  };

  return (
    <BottomSheet
      name="select-grocery-list-sheet"
      ref={sheetRef}
      onStartClose={() => {
        KeyboardController.dismiss();
        setIsCreating(false);
        setNewListName('');
      }}
    >
      <BottomSheet.Header title="Select List" />

      <View className="mt-4 gap-1">
        {lists?.grocery_lists.map(list => {
          const isSelected = list.id === selectedListId;

          return (
            <Pressable
              key={list.id}
              onPress={() => handleSelectList(list.id)}
              className={cn(
                'flex-row items-center justify-between rounded-xl px-4 py-3',
                isSelected ? 'bg-primary/10' : 'active:bg-muted'
              )}
            >
              <Text
                className={cn(
                  'text-lg',
                  isSelected && 'font-semibold text-primary'
                )}
              >
                {list.name}
              </Text>
              {isSelected && (
                <Icon as={CheckIcon} size={20} className="text-primary" />
              )}
            </Pressable>
          );
        })}
      </View>

      <View className="mt-4 border-t border-border pt-4">
        {isCreating ? (
          <View className="gap-3">
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
            <View className="flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onPress={handleCancelCreating}
              >
                <Text>Cancel</Text>
              </Button>
              <Button
                className="flex-1"
                onPress={handleCreateList}
                disabled={!newListName.trim()}
              >
                <Text>Create</Text>
              </Button>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={handleStartCreating}
            className="flex-row items-center gap-3 rounded-xl px-4 py-3 active:bg-muted"
          >
            <Icon as={PlusIcon} size={20} className="text-primary" />
            <Text className="text-lg text-primary">Create New List</Text>
          </Pressable>
        )}
      </View>
    </BottomSheet>
  );
});

SelectGroceryListSheet.displayName = 'SelectGroceryListSheet';

