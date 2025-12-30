import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { CheckIcon, LinkIcon, PlusIcon, UsersIcon } from 'lucide-react-native';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

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
import {
  useCanDeleteGroceryList,
  useDeleteGroceryList,
} from '../instant/useDeleteGroceryList';
import { useGroceryLists } from '../instant/useGroceryLists';
import { useLeaveGroceryList } from '../instant/useLeaveGroceryList';
import { useTrackListAccess } from '../instant/useTrackListAccess';

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
  const canDeleteList = useCanDeleteGroceryList();
  const leaveGroceryList = useLeaveGroceryList();
  const trackListAccess = useTrackListAccess();

  useImperativeHandle(ref, () => ({
    present: () => sheetRef.current?.present(),
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const handleSelectList = (listId: string) => {
    trackListAccess(listId);
    onSelectList(listId);
    sheetRef.current?.dismiss();
  };

  const handleCreated = (listId: string) => {
    trackListAccess(listId);
    onSelectList(listId);
    sheetRef.current?.dismiss();
  };

  const handleJoined = (listId: string) => {
    trackListAccess(listId);
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
            const deleted = await deleteGroceryList(listId);
            // If the deleted list was selected, select another list
            if (deleted && selectedListId === listId) {
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
      <BottomSheet
        detents={[0.7]}
        name="select-grocery-list-sheet"
        ref={sheetRef}
        scrollable
      >
        <BottomSheet.Header
          className="px-4"
          title="Select List"
          button={
            <DropdownMenuRoot
              trigger={
                <Button size="icon">
                  <Icon
                    as={PlusIcon}
                    size={24}
                    className="text-primary-foreground"
                  />
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

        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          className="mt-4 gap-1 px-4 pb-4"
        >
          {lists?.grocery_lists.map(list => {
            const isSelected = list.id === selectedListId;
            const isOwner = user?.id === list.ownerId;
            const isShared = (list.shares?.length ?? 0) > 1;

            return (
              <ContextMenuRoot
                key={list.id}
                trigger={
                  <Pressable
                    onPress={() => handleSelectList(list.id)}
                    className={cn(
                      'flex-row items-center justify-between rounded-xl px-4 py-3',
                      isSelected ? 'bg-muted' : 'active:bg-muted'
                    )}
                  >
                    <View className="flex-row items-center gap-2">
                      <Text
                        className={cn(
                          'text-lg',
                          isSelected && 'font-medium text-foreground'
                        )}
                      >
                        {list.name}
                      </Text>
                      {isShared && (
                        <Icon
                          as={UsersIcon}
                          size={16}
                          className="text-muted-foreground"
                        />
                      )}
                    </View>
                    {isSelected && (
                      <Icon
                        as={CheckIcon}
                        size={20}
                        className="text-foreground"
                      />
                    )}
                  </Pressable>
                }
              >
                <ContextMenuItem
                  key={`delete-or-leave-${list.id}`}
                  destructive
                  disabled={!canDeleteList}
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
        </ScrollView>
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
