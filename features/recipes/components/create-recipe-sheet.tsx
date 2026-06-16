import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';

import { BottomSheet } from '../../../components/bottom-sheet';
import { MetaBarLayout } from '../../../components/meta-bar-layout';
import { ScrollingMetaBar } from '../../../components/scrolling-meta-bar';
import { Button } from '../../../components/ui/button';
import { Text } from '../../../components/ui/text';
import { useUncontrolledTextInput } from '../../../components/use-uncontrolled-text-input';
import { MealTimeSheet } from '../../meal-planner/components/meal-time-sheet';

import { RecipeUrlSheet } from './recipe-url-sheet';

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
  const nameInput = useUncontrolledTextInput(defaultValues?.name ?? '');
  const descriptionInput = useUncontrolledTextInput(
    defaultValues?.description ?? ''
  );
  const [canSubmit, setCanSubmit] = useState(
    Boolean(defaultValues?.name?.trim())
  );
  const [mealTag, setMealTag] = useState<string | undefined>(undefined);
  const [sourceUrl, setSourceUrl] = useState(defaultValues?.sourceUrl ?? '');
  const nameInputRef = useRef<TextInput>(null);
  const isEditing = !!defaultValues;

  useImperativeHandle(ref, () => ({
    present: () => {
      // Reset or set initial values when opening
      const nextName = defaultValues?.name ?? '';
      nameInput.reset(nextName);
      descriptionInput.reset(defaultValues?.description ?? '');
      setCanSubmit(Boolean(nextName.trim()));
      setMealTag(defaultValues?.mealTag ?? undefined);
      setSourceUrl(defaultValues?.sourceUrl ?? '');
      sheetRef.current?.present();
    },
    dismiss: () => {
      sheetRef.current?.dismiss();
    },
  }));

  const handleSubmit = () => {
    const name = nameInput.getValue().trim();
    if (!name) {
      return;
    }

    onSubmit({
      name,
      mealTag,
      description: descriptionInput.getValue().trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
    });
    sheetRef.current?.dismiss();
  };

  const handleNameChange = (text: string) => {
    nameInput.handleChangeText(text);
    setCanSubmit(Boolean(text.trim()));
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
      footer={
        <View className="px-10 pb-4">
          <Button onPress={handleSubmit} disabled={!canSubmit}>
            <Text>{isEditing ? 'Update Recipe' : 'Create Recipe'}</Text>
          </Button>
        </View>
      }
    >
      <BottomSheet.SheetView className="pb-safe">
        <BottomSheet.Header
          className="mb-0"
          title={isEditing ? 'Edit Recipe' : 'Create Recipe'}
        />

        <View>
          <View>
            <BottomSheet.BareTextInput
              key={nameInput.inputKey}
              ref={nameInputRef}
              defaultValue={nameInput.defaultValue}
              onChangeText={handleNameChange}
              placeholder="Recipe name"
              className="text-2xl font-bold "
              autoCapitalize="words"
            />
          </View>
          <View>
            <BottomSheet.BareTextInput
              key={descriptionInput.inputKey}
              defaultValue={descriptionInput.defaultValue}
              onChangeText={descriptionInput.handleChangeText}
              placeholder="Description"
              multiline
              numberOfLines={5}
              className="h-24 text-lg font-medium"
            />
          </View>
          <MetaBarLayout>
            <ScrollingMetaBar>
              <MealTimeSheet
                mealTime={mealTag}
                onSelect={setMealTag}
                disabled={!canSubmit}
              />
              <RecipeUrlSheet
                sourceUrl={sourceUrl}
                onSelect={url => setSourceUrl(url ?? '')}
                disabled={!canSubmit}
              />
            </ScrollingMetaBar>
          </MetaBarLayout>
        </View>
      </BottomSheet.SheetView>
    </BottomSheet>
  );
});

CreateRecipeSheet.displayName = 'CreateRecipeSheet';
