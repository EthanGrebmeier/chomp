import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { CheckIcon, LinkIcon, PlusIcon } from 'lucide-react-native';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { BottomSheet } from '../../../components/bottom-sheet';
import { Button } from '../../../components/ui/button';
import {
  ContextMenuItem,
  ContextMenuItemIcon,
  ContextMenuItemTitle,
  ContextMenuRoot,
} from '../../../components/ui/context-menu';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '../../../components/ui/dropdown-menu';
import { Icon } from '../../../components/ui/icon';
import { Text } from '../../../components/ui/text';
import { db } from '../../../lib/instant';
import { cn } from '../../../lib/utils';
import { useDeleteGroceryList } from '../instant/useDeleteGroceryList';
import { useGroceryLists } from '../instant/useGroceryLists';
import { useLeaveGroceryList } from '../instant/useLeaveGroceryList';

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
  const { user } = db.useAuth();
  const deleteGroceryList = useDeleteGroceryList();
  const leaveGroceryList = useLeaveGroceryList();

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

  const handleDeleteList = (listId: string, listName: string) => {
    Alert.alert(
      'Delete List',
      `Are you sure you want to delete "${listName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteGroceryList(listId);
            // If the deleted list was selected, clear selection
            if (selectedListId === listId) {
              const remainingLists = lists?.grocery_lists.filter(
                l => l.id !== listId
              );
              if (remainingLists && remainingLists.length > 0) {
                onSelectList(remainingLists[0].id);
              }
            }
          },
        },
      ]
    );
  };

  const handleLeaveList = (listId: string, listName: string) => {
    Alert.alert('Leave List', `Are you sure you want to leave "${listName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          await leaveGroceryList(listId);
          // If the left list was selected, select another list
          if (selectedListId === listId) {
            const remainingLists = lists?.grocery_lists.filter(
              l => l.id !== listId
            );
            if (remainingLists && remainingLists.length > 0) {
              onSelectList(remainingLists[0].id);
            }
          }
        },
      },
    ]);
  };

  return (
    <>
      <BottomSheet name="select-grocery-list-sheet" ref={sheetRef}>
        <BottomSheet.Header
          title="Select List"
          button={
            <DropdownMenuRoot
              trigger={
                <Button variant="ghost" size="circle">
                  <Icon as={PlusIcon} size={24} className="text-primary" />
                </Button>
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
            const isOwner = user?.id === list.ownerId;

            return (
              <ContextMenuRoot
                key={list.id}
                trigger={
                  <Pressable
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
                }
              >
                <ContextMenuItem
                  key={`delete-or-leave-${list.id}`}
                  destructive
                  onSelect={() => {
                    if (isOwner) {
                      handleDeleteList(list.id, list.name);
                    } else {
                      handleLeaveList(list.id, list.name);
                    }
                  }}
                >
                  <ContextMenuItemTitle>
                    {isOwner ? 'Delete List' : 'Leave List'}
                  </ContextMenuItemTitle>
                  <ContextMenuItemIcon
                    ios={{
                      name: isOwner
                        ? 'trash'
                        : 'rectangle.portrait.and.arrow.right',
                    }}
                  />
                </ContextMenuItem>
              </ContextMenuRoot>
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
