import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';

import { BottomSheet } from '../../../components/bottom-sheet';
import { MetaBarLayout } from '../../../components/meta-bar-layout';
import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';
import { MealTimeSheet } from '../../meal-planner/components/meal-time-sheet';

type CreateRecipeSheetProps = {
  onSubmit: (data: {
    name: string;
    mealTag?: string;
    description?: string;
    sourceUrl?: string;
  }) => void;
  onClose?: () => void;
  defaultValues?: {
    name: string;
    mealTag?: string;
    description?: string;
    sourceUrl?: string;
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
  const [mealTag, setMealTag] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState(
    defaultValues?.description ?? ''
  );
  const [sourceUrl, setSourceUrl] = useState(defaultValues?.sourceUrl ?? '');
  const nameInputRef = useRef<TextInput>(null);
  const isEditing = !!defaultValues;

  useImperativeHandle(ref, () => ({
    present: () => {
      // Reset or set initial values when opening
      setName(defaultValues?.name ?? '');
      setMealTag(defaultValues?.mealTag ?? undefined);
      setDescription(defaultValues?.description ?? '');
      setSourceUrl(defaultValues?.sourceUrl ?? '');
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

    onSubmit({
      name: name.trim(),
      mealTag,
      description: description.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
    });
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
      <BottomSheet.SheetView>
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
              autoCapitalize="words"
            />
          </View>
          <View>
            <Text className="mb-2 text-sm font-medium text-muted-foreground">
              Description
            </Text>
            <BottomSheet.TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add a description (optional)"
              multiline
              numberOfLines={5}
              className="h-24"
            />
          </View>
          <View>
            <Text className="mb-2 text-sm font-medium text-muted-foreground">
              Link
            </Text>
            <BottomSheet.TextInput
              value={sourceUrl}
              onChangeText={setSourceUrl}
              placeholder="Recipe URL (optional)"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <MetaBarLayout
            action={
              <Button onPress={handleSubmit} disabled={!name.trim()}>
                <Text>{isEditing ? 'Update Recipe' : 'Create Recipe'}</Text>
              </Button>
            }
          >
            <View className="flex-row">
              <MealTimeSheet mealTime={mealTag} onSelect={setMealTag} />
            </View>
          </MetaBarLayout>
        </View>
      </BottomSheet.SheetView>
    </BottomSheet>
  );
});

CreateRecipeSheet.displayName = 'CreateRecipeSheet';
