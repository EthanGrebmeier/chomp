import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { router } from 'expo-router';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export type GuestRecipeImportSheetRef = {
  present: () => void;
  dismiss: () => void;
};

export const GuestRecipeImportSheet = forwardRef<GuestRecipeImportSheetRef>(
  (_, ref) => {
    const sheetRef = useRef<TrueSheet>(null);

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const handleCreateAccount = () => {
      sheetRef.current?.dismiss();
      router.dismissTo('/(auth)/sign-in');
    };

    return (
      <BottomSheet
        name="guest-recipe-import-sheet"
        ref={sheetRef}
        footer={
          <View className="gap-2 px-10 pb-4">
            <Button size="lg" onPress={handleCreateAccount}>
              <Text>Create Account</Text>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onPress={() => sheetRef.current?.dismiss()}
            >
              <Text>Maybe Later</Text>
            </Button>
          </View>
        }
      >
        <BottomSheet.SheetView className="pb-24">
          <BottomSheet.Header
            title="Create an account to import"
            description="Import recipes from a URL and keep them synced across devices."
          />
        </BottomSheet.SheetView>
      </BottomSheet>
    );
  }
);

GuestRecipeImportSheet.displayName = 'GuestRecipeImportSheet';
