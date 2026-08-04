import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import { LinkIcon, PlusIcon } from 'lucide-react-native';
import { useRef } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';

import { Heading } from '@/components/text/heading';
import { Button } from '@/components/ui/button';
import {
  ContextMenuItem,
  ContextMenuItemIcon,
  ContextMenuItemTitle,
  ContextMenuRoot,
} from '@/components/ui/context-menu';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemTitle,
  DropdownMenuRoot,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import {
  CreateGroceryListSheet,
  CreateGroceryListSheetRef,
} from '@/features/grocery-lists/components/create-grocery-list-sheet';
import {
  JoinByCodeSheet,
  JoinByCodeSheetRef,
} from '@/features/grocery-lists/components/join-by-code-sheet';
import {
  useCanDeleteGroceryList,
  useDeleteGroceryList,
} from '@/features/grocery-lists/instant/useDeleteGroceryList';
import { useGroceryLists } from '@/features/grocery-lists/instant/useGroceryLists';
import { useLeaveGroceryList } from '@/features/grocery-lists/instant/useLeaveGroceryList';
import { useTrackListAccess } from '@/features/grocery-lists/instant/useTrackListAccess';
import { db } from '@/lib/instant';
import { buildListUrl } from '@/lib/navigation';

import { HapticPressable } from '../../components/ui/haptic-pressable';

type GroceryList = NonNullable<
  ReturnType<typeof useGroceryLists>['data']
>['grocery_lists'][number];

const EMPTY_GROCERY_LISTS: GroceryList[] = [];

export default function GroceryListsIndex() {
  const { selectedListId, view } = useLocalSearchParams<{
    selectedListId?: string;
    view?: string;
  }>();
  const createSheetRef = useRef<CreateGroceryListSheetRef>(null);
  const joinSheetRef = useRef<JoinByCodeSheetRef>(null);
  const { data, isLoading } = useGroceryLists();
  const { user } = db.useAuth();
  const deleteGroceryList = useDeleteGroceryList();
  const leaveGroceryList = useLeaveGroceryList();
  const canDeleteList = useCanDeleteGroceryList();
  const trackListAccess = useTrackListAccess();
  const groceryLists = data?.grocery_lists ?? EMPTY_GROCERY_LISTS;
  const listView = view === 'meal-plan' ? 'meal-plan' : undefined;

  const handleSelectList = (listId: string) => {
    void trackListAccess(listId);
    router.dismissTo(buildListUrl({ listId, view: listView }));
  };

  const selectFallbackAfterRemoval = (removedListId: string) => {
    if (selectedListId !== removedListId) {
      return;
    }

    const nextList = groceryLists.find(list => list.id !== removedListId);
    router.setParams({ selectedListId: nextList?.id });
  };

  const handleDeleteList = (list: GroceryList) => {
    Alert.alert(
      'Delete List',
      `Are you sure you want to delete "${list.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const deleted = await deleteGroceryList(list.id);
            if (deleted) {
              selectFallbackAfterRemoval(list.id);
            }
          },
        },
      ]
    );
  };

  const handleLeaveList = (list: GroceryList) => {
    Alert.alert(
      'Leave List',
      `Are you sure you want to leave "${list.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            await leaveGroceryList(list.id);
            selectFallbackAfterRemoval(list.id);
          },
        },
      ]
    );
  };

  const renderList = ({ item }: ListRenderItemInfo<GroceryList>) => {
    const isOwner = user?.id === item.ownerId;
    const isShared = (item.shares?.length ?? 0) > 1;

    const row = (
      <HapticPressable
        onPress={() => handleSelectList(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.name}`}
        className="min-h-[72px] flex-row items-center"
      >
        <View className="flex-1 flex-row items-center gap-2.5">
          <Text
            variant="h3"
            className="flex-shrink font-medium"
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {isShared ? (
            <View className="rounded-lg bg-primary/10 px-1.5 py-0.5">
              <Text className="font-semibold text-primary">Shared</Text>
            </View>
          ) : null}
        </View>
      </HapticPressable>
    );

    return (
      <ContextMenuRoot trigger={row}>
        <ContextMenuItem
          key={`delete-or-leave-${item.id}`}
          destructive
          disabled={isOwner && !canDeleteList}
          onSelect={() => {
            if (isOwner) {
              handleDeleteList(item);
            } else {
              handleLeaveList(item);
            }
          }}
        >
          <ContextMenuItemTitle>
            {isOwner ? 'Delete List' : 'Leave List'}
          </ContextMenuItemTitle>
          <ContextMenuItemIcon
            ios={{
              name: isOwner ? 'trash' : 'rectangle.portrait.and.arrow.right',
            }}
          />
        </ContextMenuItem>
      </ContextMenuRoot>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-5 pb-4 pt-2">
        <Heading size="lg">Grocery Lists</Heading>
        <DropdownMenuRoot
          trigger={
            <Button size="icon" accessibilityLabel="Add grocery list">
              <Icon
                as={PlusIcon}
                size={24}
                strokeWidth={3}
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
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlashList
          data={groceryLists}
          renderItem={renderList}
          keyExtractor={item => item.id}
          contentContainerClassName="px-5 pb-8 pt-1"
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-4 py-16">
              <Text className="text-center text-muted-foreground">
                No grocery lists available
              </Text>
            </View>
          }
        />
      )}

      <CreateGroceryListSheet
        ref={createSheetRef}
        onCreated={handleSelectList}
      />
      <JoinByCodeSheet ref={joinSheetRef} onJoined={handleSelectList} />
    </View>
  );
}
