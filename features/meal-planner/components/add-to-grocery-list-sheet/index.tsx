import { navigation } from '@/lib/navigation';
import { router } from 'expo-router';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import { BottomSheet } from '../../../../components/bottom-sheet';
import { Button } from '../../../../components/ui/button';
import { Text } from '../../../../components/ui/text';
import { useAddMealPlanToGroceryList } from '../../hooks/useAddMealPlanToGroceryList';
import { GroceryListOptions } from '../recent-grocery-lists';
import {
  GroceryListSearchSheet,
  GroceryListSearchSheetRef,
} from './list-search-sheet';

type AddToGroceryListSheetProps = {
  mealPlanId: string;
  mealPlanName: string;
};

export type AddToGroceryListSheetRef = {
  open: () => void;
  close: () => void;
};

export const AddToGroceryListSheet = forwardRef<
  AddToGroceryListSheetRef,
  AddToGroceryListSheetProps
>(({ mealPlanId, mealPlanName }, ref) => {
  const groceryListSearchSheetRef = useRef<GroceryListSearchSheetRef | null>(
    null
  );
  const bottomSheetRef = useRef<any>(null);

  const { mutate: addToGroceryList, isPending: isAdding } =
    useAddMealPlanToGroceryList();

  useImperativeHandle(ref, () => ({
    open: () => {
      bottomSheetRef.current?.present();
    },
    close: () => {
      bottomSheetRef.current?.dismiss();
    },
  }));

  const handleCreateNewList = () => {
    addToGroceryList(
      { mealPlanId },
      {
        onSuccess: result => {
          router.push(
            navigation.goToList(result.groceryListId, { autofocus: true })
          );
          bottomSheetRef.current?.dismiss();
        },
        onError: error => {
          console.error('Failed to add ingredients to grocery list:', error);
        },
      }
    );
  };

  const handleAddToExistingList = (listId: string) => {
    addToGroceryList(
      { mealPlanId, groceryListId: listId },
      {
        onSuccess: result => {
          router.push(
            navigation.goToList(result.groceryListId, { autofocus: true })
          );
          bottomSheetRef.current?.dismiss();
        },
        onError: error => {
          console.error('Failed to add to existing grocery list:', error);
        },
      }
    );
  };

  return (
    <>
      <BottomSheet ref={bottomSheetRef}>
        <BottomSheet.Header title="Add to Grocery List" />

        <View className="mt-6 flex-1">
          {/* Option to create new list */}
          <View className="mb-6">
            <Button
              onPress={handleCreateNewList}
              disabled={isAdding}
              className="w-full"
            >
              <Text>
                {isAdding ? 'Creating...' : 'Create New List & Add Items'}
              </Text>
            </Button>
          </View>

          {/* Divider */}
          <View className="mb-6 flex-row items-center">
            <View className="flex-1 border-t border-border" />
            <Text className="mx-4 text-sm text-muted-foreground">OR</Text>
            <View className="flex-1 border-t border-border" />
          </View>

          {/* List options */}
          <GroceryListOptions
            onSearch={() => {
              groceryListSearchSheetRef.current?.open();
              bottomSheetRef.current?.dismiss();
            }}
            onAddToList={handleAddToExistingList}
            isAdding={isAdding}
          />
        </View>
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
});
