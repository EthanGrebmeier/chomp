import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';

import { SheetFooter } from '@/components/sheet-content';
import { BottomActionButton } from '@/components/ui/bottom-action-button';

import { BottomSheet } from '../bottom-sheet';
import { TextInput } from '../text-input';
import { CloseButton } from '../ui/close-button';
import { Text } from '../ui/text';
import { useUncontrolledTextInput } from '../use-uncontrolled-text-input';

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
    const unitInput = useUncontrolledTextInput();
    const [canSave, setCanSave] = useState(false);

    useImperativeHandle(ref, () => ({
      present: (currentUnit: string) => {
        const nextUnit = currentUnit ?? '';
        unitInput.reset(nextUnit);
        setCanSave(nextUnit.trim().length > 0);
        sheetRef.current?.present();
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const handleSave = () => {
      const trimmedUnit = unitInput.getValue().trim();
      if (!canSave) return;
      onSave(trimmedUnit);
      sheetRef.current?.dismiss();
    };

    const handleChangeText = (text: string) => {
      unitInput.handleChangeText(text);
      setCanSave(text.trim().length > 0);
    };

    const handleCancel = () => {
      sheetRef.current?.dismiss();
    };

    const handleDismiss = () => {
      unitInput.reset();
      setCanSave(false);
    };

    return (
      <BottomSheet
        name="edit-unit-sheet"
        ref={sheetRef}
        onStartOpen={() => {
          inputRef.current?.focus();
        }}
        onDismiss={handleDismiss}
        footer={
          <SheetFooter>
            <BottomActionButton onPress={handleSave} disabled={!canSave}>
              <Text>Save</Text>
            </BottomActionButton>
          </SheetFooter>
        }
      >
        <BottomSheet.SheetView>
          <BottomSheet.Header
            title="Enter a custom unit"
            backAction={<CloseButton onPress={handleCancel} />}
            className="mb-0"
          />

          <View className="my-4 gap-2">
            <BottomSheet.TextInput
              key={unitInput.inputKey}
              ref={inputRef}
              defaultValue={unitInput.defaultValue}
              onChangeText={handleChangeText}
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
