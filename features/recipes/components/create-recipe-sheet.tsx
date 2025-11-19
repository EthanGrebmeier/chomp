import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';

import { BottomSheet } from '../../../components/bottom-sheet';
import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';

type CreateRecipeSheetProps = {
  onSubmit: (data: { name: string }) => void;
  onClose?: () => void;
  defaultValues?: {
    name: string;
  } | null;
};

export type CreateRecipeSheetRef = {
  present: () => void;
  dismiss: () => void;
};

export const CreateRecipeSheet = forwardRef<
  CreateRecipeSheetRef,
  CreateRecipeSheetProps
>(({ onSubmit, onClose, defaultValues }, ref) => {
  const sheetRef = useRef<TrueSheet>(null);
  const [name, setName] = useState(defaultValues?.name ?? '');
  const nameInputRef = useRef<TextInput>(null);
  const isEditing = !!defaultValues;

  useImperativeHandle(ref, () => ({
    present: () => {
      // Reset or set initial values when opening
      setName(defaultValues?.name ?? '');
      nameInputRef.current?.focus();
      sheetRef.current?.present();
    },
    dismiss: () => {
      sheetRef.current?.dismiss();
    },
  }));

  const handleSubmit = () => {
    if (!name.trim()) {
      return;
    }

    onSubmit({ name: name.trim() });
    sheetRef.current?.dismiss();
  };

  const handleClose = () => {
    KeyboardController.dismiss();
    onClose?.();
  };

  return (
    <BottomSheet
      name="create-recipe-sheet"
      ref={sheetRef}
      onStartClose={handleClose}
    >
      <View className="gap-6">
        <BottomSheet.Header
          title={isEditing ? 'Edit Recipe' : 'Create Recipe'}
        />

        <View className="gap-4">
          <View>
            <Text className="mb-2 text-sm font-medium text-muted-foreground">
              Recipe Name
            </Text>
            <BottomSheet.TextInput
              ref={nameInputRef}
              value={name}
              onChangeText={setName}
              placeholder="Enter recipe name"
              autoFocus
            />
          </View>
        </View>

        <Button
          onPress={handleSubmit}
          disabled={!name.trim()}
          className="w-full"
        >
          <Text>{isEditing ? 'Update Recipe' : 'Create Recipe'}</Text>
        </Button>
      </View>
    </BottomSheet>
  );
});

CreateRecipeSheet.displayName = 'CreateRecipeSheet';
