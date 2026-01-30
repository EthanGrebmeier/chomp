import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';

import { BottomSheet } from '../bottom-sheet';
import { TextInput } from '../text-input';
import { Button } from '../ui/button';
import { CloseButton } from '../ui/close-button';
import { Text } from '../ui/text';

import { MAX_UNIT_LENGTH } from './units';

export type EditUnitSheetRef = {
  present: (currentUnit: string) => void;
  dismiss: () => void;
};

type EditUnitSheetProps = {
  onSave: (unit: string) => void;
};

export const EditUnitSheet = forwardRef<EditUnitSheetRef, EditUnitSheetProps>(
  ({ onSave }, ref) => {
    const sheetRef = useRef<TrueSheet>(null);
    const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
    const [unitValue, setUnitValue] = useState('');

    useImperativeHandle(ref, () => ({
      present: (currentUnit: string) => {
        setUnitValue(currentUnit ?? '');
        sheetRef.current?.present();
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const trimmedUnit = unitValue.trim();
    const canSave = trimmedUnit.length > 0;

    const handleSave = () => {
      if (!canSave) return;
      onSave(trimmedUnit);
      sheetRef.current?.dismiss();
    };

    const handleCancel = () => {
      sheetRef.current?.dismiss();
    };

    const handleDismiss = () => {
      KeyboardController.dismiss();
      setUnitValue('');
    };

    return (
      <BottomSheet
        name="edit-unit-sheet"
        ref={sheetRef}
        onStartClose={handleDismiss}
        footer={
          <View className="px-10 pb-4">
            <Button onPress={handleSave} disabled={!canSave}>
              <Text>Save</Text>
            </Button>
          </View>
        }
      >
        <BottomSheet.SheetView className="pb-safe">
          <BottomSheet.Header
            title="Edit Unit"
            dismissButton={<CloseButton onPress={handleCancel} />}
          />

          <View className="my-4 gap-2">
            <BottomSheet.TextInput
              ref={inputRef}
              value={unitValue}
              onChangeText={setUnitValue}
              placeholder="e.g. bunch"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              maxLength={MAX_UNIT_LENGTH}
              onSubmitEditing={handleSave}
            />
            <Text className="text-sm text-muted-foreground">
              Up to {MAX_UNIT_LENGTH} characters.
            </Text>
          </View>
        </BottomSheet.SheetView>
      </BottomSheet>
    );
  }
);

EditUnitSheet.displayName = 'EditUnitSheet';
