import { navigation } from '@/lib/navigation';
import { router } from 'expo-router';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import { BottomSheet } from '../../../../components/bottom-sheet';
import { Button } from '../../../../components/ui/button';
import { Text } from '../../../../components/ui/text';

type AddToGroceryListSheetProps = {
  onItemsAdded: () => Promise<void>;
  title?: string;
  buttonText?: string;
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
      onItemsAdded,
      title = 'Add to Grocery List',
      buttonText = 'Add Items to Shopping List',
    },
    ref
  ) => {
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

    const handleAddItems = async () => {
      try {
        setIsLoading(true);

        // Call the callback to add items
        await onItemsAdded();

        // Navigate to the list
        router.push(navigation.goToList());

        bottomSheetRef.current?.dismiss();
      } catch (error) {
        console.error('Failed to add to grocery list:', error);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <BottomSheet ref={bottomSheetRef}>
        <View className="flex-1 gap-4">
          <Text className="text-xl font-bold">{title}</Text>
          <Button
            onPress={handleAddItems}
            disabled={isLoading}
            className="w-full"
          >
            <Text>{isLoading ? 'Adding...' : buttonText}</Text>
          </Button>
        </View>
      </BottomSheet>
    );
  }
);
