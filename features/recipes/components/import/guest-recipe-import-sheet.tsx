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
        <BottomSheet.SheetView className="gap-5 pb-24">
          <BottomSheet.Header title="Create an Account" className="mb-0" />

          <View className="items-center gap-4">
            <View className="gap-2">
              <Text className="text-center text-lg font-semibold text-foreground">
                AI recipe import is for signed-in accounts
              </Text>
              <Text className="text-center text-base text-muted-foreground">
                Create an account to import recipes from a URL and keep your
                recipes synced across devices.
              </Text>
            </View>
          </View>
        </BottomSheet.SheetView>
      </BottomSheet>
    );
  }
);

GuestRecipeImportSheet.displayName = 'GuestRecipeImportSheet';
