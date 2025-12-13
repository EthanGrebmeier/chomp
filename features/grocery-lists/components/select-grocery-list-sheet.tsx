import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { CheckIcon, LinkIcon, PlusIcon } from 'lucide-react-native';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Pressable, View } from 'react-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '../../../components/ui/dropdown-menu';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { cn } from '../../../lib/utils';
import { useGroceryLists } from '../instant/useGroceryLists';

import {
  CreateGroceryListSheet,
  CreateGroceryListSheetRef,
} from './create-grocery-list-sheet';
import { JoinByCodeSheet, JoinByCodeSheetRef } from './join-by-code-sheet';

export type SelectGroceryListSheetRef = {
  present: () => void;
  dismiss: () => void;
};

type SelectGroceryListSheetProps = {
  selectedListId: string | undefined;
  onSelectList: (listId: string) => void;
};

export const SelectGroceryListSheet = forwardRef<
  SelectGroceryListSheetRef,
  SelectGroceryListSheetProps
>(({ selectedListId, onSelectList }, ref) => {
  const sheetRef = useRef<TrueSheet>(null);
  const createSheetRef = useRef<CreateGroceryListSheetRef>(null);
  const joinSheetRef = useRef<JoinByCodeSheetRef>(null);

  const { data: lists } = useGroceryLists();

  useImperativeHandle(ref, () => ({
    present: () => sheetRef.current?.present(),
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const handleSelectList = (listId: string) => {
    onSelectList(listId);
    sheetRef.current?.dismiss();
  };

  const handleCreated = (listId: string) => {
    onSelectList(listId);
    sheetRef.current?.dismiss();
  };

  const handleJoined = (listId: string) => {
    onSelectList(listId);
    sheetRef.current?.dismiss();
  };

  return (
    <>
      <BottomSheet name="select-grocery-list-sheet" ref={sheetRef}>
        <BottomSheet.Header
          title="Select List"
          button={
            <DropdownMenuRoot
              trigger={
                <Pressable className="rounded-full p-2 active:bg-muted">
                  <Icon as={PlusIcon} size={24} className="text-primary" />
                </Pressable>
              }
            >
              <DropdownMenuContent>
                <DropdownMenuItem
                  key="create"
                  onSelect={() => createSheetRef.current?.present()}
                >
                  <DropdownMenuItemIcon ios={{ name: 'plus' }}>
                    <Icon as={PlusIcon} size={16} />
                  </DropdownMenuItemIcon>
                  <DropdownMenuItemTitle>Create New List</DropdownMenuItemTitle>
                </DropdownMenuItem>
                <DropdownMenuItem
                  key="join"
                  onSelect={() => joinSheetRef.current?.present()}
                >
                  <DropdownMenuItemIcon ios={{ name: 'link' }}>
                    <Icon as={LinkIcon} size={16} />
                  </DropdownMenuItemIcon>
                  <DropdownMenuItemTitle>Join by Code</DropdownMenuItemTitle>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuRoot>
          }
        />

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
        <CreateGroceryListSheet
          ref={createSheetRef}
          onCreated={handleCreated}
        />
        <JoinByCodeSheet ref={joinSheetRef} onJoined={handleJoined} />
      </BottomSheet>
    </>
  );
});

SelectGroceryListSheet.displayName = 'SelectGroceryListSheet';
