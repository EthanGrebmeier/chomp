import { navigation } from '@/lib/navigation';
import { generateId } from '@/lib/utils';
import { router } from 'expo-router';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import { BottomSheet } from '../../../../components/bottom-sheet';
import { Button } from '../../../../components/ui/button';
import { Text } from '../../../../components/ui/text';
import { groceryListTable } from '../../../../db/schema';
import { db } from '../../../../providers/migration-provider';
import { GroceryListOptions } from '../grocery-list-options';
import {
  GroceryListSearchSheet,
  GroceryListSearchSheetRef,
} from './list-search-sheet';

type AddToGroceryListSheetProps = {
  onListSelected: (listId: string, isNewList: boolean) => Promise<void>;
  title?: string;
  createNewButtonText?: string;
};

export type AddToGroceryListSheetRef = {
  open: () => void;
  close: () => void;
};

export const AddToGroceryListSheet = forwardRef<
  AddToGroceryListSheetRef,
  AddToGroceryListSheetProps
>(
  (
    {
      onListSelected,
      title = 'Add to Grocery List',
      createNewButtonText = 'Create New List & Add Items',
    },
    ref
  ) => {
    const groceryListSearchSheetRef = useRef<GroceryListSearchSheetRef | null>(
      null
    );
    const bottomSheetRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useImperativeHandle(ref, () => ({
      open: () => {
        bottomSheetRef.current?.present();
      },
      close: () => {
        bottomSheetRef.current?.dismiss();
      },
    }));

    const handleCreateNewList = async () => {
      try {
        setIsLoading(true);
        const newListId = generateId();

        // Create a new empty grocery list
        const now = new Date().toISOString();
        await db.insert(groceryListTable).values({
          id: newListId,
          name: 'New Grocery List',
          date: now,
          createdAt: now,
          updatedAt: now,
        });

        // Call the callback with the new list ID
        await onListSelected(newListId, true);

        // Navigate to the new list (autofocus for new lists)
        router.push(navigation.goToList(newListId, { autofocus: true }));

        bottomSheetRef.current?.dismiss();
      } catch (error) {
        console.error('Failed to create new grocery list:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleAddToExistingList = async (listId: string) => {
      try {
        setIsLoading(true);

        // Call the callback with the existing list ID
        await onListSelected(listId, false);

        // Navigate to the list (no autofocus for existing lists)
        router.push(navigation.goToList(listId, { autofocus: false }));

        bottomSheetRef.current?.dismiss();
      } catch (error) {
        console.error('Failed to add to existing grocery list:', error);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <>
        <BottomSheet ref={bottomSheetRef}>
          <View className="flex-1">
            {/* List options */}
            <GroceryListOptions
              onSearch={() => {
                groceryListSearchSheetRef.current?.open();
                bottomSheetRef.current?.dismiss();
              }}
              onAddToList={handleAddToExistingList}
              isAdding={isLoading}
            />
          </View>
          <Button
            onPress={handleCreateNewList}
            disabled={isLoading}
            className="w-full"
          >
            <Text>{isLoading ? 'Creating...' : createNewButtonText}</Text>
          </Button>
        </BottomSheet>
        <GroceryListSearchSheet
          ref={groceryListSearchSheetRef}
          onSelectList={list => handleAddToExistingList(list.id)}
          title="Select Grocery List"
          onCancel={() => {
            bottomSheetRef.current?.present();
          }}
        />
      </>
    );
  }
);
